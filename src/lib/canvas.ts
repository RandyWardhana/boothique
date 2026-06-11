/** Low-level canvas / image helpers shared across rendering code. */

/** Short, collision-unlikely id for shots and stickers. */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

/** Load an image from a URL or data URL, resolving once decoded. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Draw `media` into the box `(x, y, w, h)` using object-fit: cover semantics —
 * the source is center-cropped to fill the box without distortion.
 */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  media: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
  mediaW?: number,
  mediaH?: number,
): void {
  const mw = mediaW ?? intrinsicWidth(media);
  const mh = mediaH ?? intrinsicHeight(media);
  if (!mw || !mh) return;

  const mediaRatio = mw / mh;
  const boxRatio = w / h;
  let sx: number;
  let sy: number;
  let sw: number;
  let sh: number;
  if (mediaRatio > boxRatio) {
    sh = mh;
    sw = mh * boxRatio;
    sx = (mw - sw) / 2;
    sy = 0;
  } else {
    sw = mw;
    sh = mw / boxRatio;
    sx = 0;
    sy = (mh - sh) / 2;
  }
  ctx.drawImage(media, sx, sy, sw, sh, x, y, w, h);
}

function intrinsicWidth(media: CanvasImageSource): number {
  if (media instanceof HTMLImageElement) return media.naturalWidth;
  if (media instanceof HTMLVideoElement) return media.videoWidth;
  if (media instanceof HTMLCanvasElement) return media.width;
  return 0;
}

function intrinsicHeight(media: CanvasImageSource): number {
  if (media instanceof HTMLImageElement) return media.naturalHeight;
  if (media instanceof HTMLVideoElement) return media.videoHeight;
  if (media instanceof HTMLCanvasElement) return media.height;
  return 0;
}
