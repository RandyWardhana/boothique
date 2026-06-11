import type { Shot } from '@/types';
import { loadImage } from './canvas';

/**
 * True pixel-level skin smoothing for still exports — a lightweight
 * frequency-separation pass: blur the low-contrast skin regions while keeping
 * edges (eyes, hair, outlines) sharp, then gently even out redness from
 * blemishes. Live video uses the cheaper CSS approximation in `filters.ts`.
 */

/** Separable box blur over an RGBA buffer with clamped edges. */
function boxBlur(src: Uint8ClampedArray, width: number, height: number, radius: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const window = radius * 2 + 1;

  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let x = -radius; x <= radius; x++) {
        const xx = x < 0 ? 0 : x >= width ? width - 1 : x;
        sum += src[row + xx * 4 + c];
      }
      for (let x = 0; x < width; x++) {
        tmp[row + x * 4 + c] = sum / window;
        const xOut = x - radius < 0 ? 0 : x - radius;
        const xIn = x + radius + 1 >= width ? width - 1 : x + radius + 1;
        sum += src[row + xIn * 4 + c] - src[row + xOut * 4 + c];
      }
    }
  }

  for (let x = 0; x < width; x++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let y = -radius; y <= radius; y++) {
        const yy = y < 0 ? 0 : y >= height ? height - 1 : y;
        sum += tmp[(yy * width + x) * 4 + c];
      }
      for (let y = 0; y < height; y++) {
        out[(y * width + x) * 4 + c] = sum / window;
        const yOut = y - radius < 0 ? 0 : y - radius;
        const yIn = y + radius + 1 >= height ? height - 1 : y + radius + 1;
        sum += tmp[(yIn * width + x) * 4 + c] - tmp[(yOut * width + x) * 4 + c];
      }
    }
  }

  return out;
}

/**
 * Return a beautified JPEG data URL, or `null` when `amount` is 0. The source is
 * downscaled to at most 1100px on its long edge so the blur stays affordable.
 */
export function beautifyImage(img: HTMLImageElement, amount: number): string | null {
  const a = Math.max(0, Math.min(1, amount / 100));
  if (!a) return null;

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const maxDim = 1100;
  const scale = Math.max(width, height) > maxDim ? maxDim / Math.max(width, height) : 1;
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const radius = Math.max(1, Math.round((Math.min(width, height) / 130) * (0.5 + a)));
  const blurred = boxBlur(data, width, height, radius);

  const edgeThreshold = 0.05;
  const edgeSoftness = 0.14;
  const lift = 1 + a * 0.05;
  for (let i = 0; i < data.length; i += 4) {
    const or = data[i];
    const og = data[i + 1];
    const ob = data[i + 2];
    const br = blurred[i];
    const bg = blurred[i + 1];
    const bb = blurred[i + 2];

    const lumaOriginal = or * 0.299 + og * 0.587 + ob * 0.114;
    const lumaBlurred = br * 0.299 + bg * 0.587 + bb * 0.114;
    let edge = (Math.abs(lumaOriginal - lumaBlurred) / 255 - edgeThreshold) / edgeSoftness;
    edge = edge < 0 ? 0 : edge > 1 ? 1 : edge;
    edge = edge * edge * (3 - 2 * edge); // smoothstep

    const mix = a * (1 - edge);
    let nr = or * (1 - mix) + br * mix;
    const ng = og * (1 - mix) + bg * mix;
    const nb = ob * (1 - mix) + bb * mix;
    // Even out redness on skin tones (R > G >= B and reasonably bright).
    if (or > og && og >= ob && or > 60) {
      nr = nr * (1 - mix * 0.5) + Math.min(nr, br) * (mix * 0.5);
    }
    data[i] = Math.min(255, nr * lift);
    data[i + 1] = Math.min(255, ng * lift);
    data[i + 2] = Math.min(255, nb * lift);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Beautify a shot's still, memoized on the shot (bucketed to the nearest 5 so
 * dragging the slider doesn't recompute on every pixel). Resolves to a shot
 * clone with its `img` swapped for the beautified version.
 */
export async function beautifyShot(shot: Shot, amount: number): Promise<Shot> {
  if (!amount) return shot;
  const key = Math.round(amount / 5) * 5;
  const cache = (shot.beautyCache ??= {});
  if (cache[key]) return { ...shot, img: cache[key] };

  const img = await loadImage(shot.img);
  const url = beautifyImage(img, key) ?? shot.img;
  cache[key] = url;
  return { ...shot, img: url };
}
