import type { Slot } from '@/types';

/**
 * Load an overlay PNG, find its transparent rectangular regions, and return
 * them as Slot coordinates scaled to the target canvas (layout) size.
 *
 * Works by scanning rows for transparency, grouping into y-bands, then
 * finding the x extent of each band. Bands smaller than 5% of image height
 * are ignored (decorative cutouts, anti-aliasing edges, etc.).
 */
export async function detectSlotsFromOverlay(
  overlayUrl: string,
  canvasW: number,
  canvasH: number,
): Promise<Slot[]> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = overlayUrl;
  });

  const pw = img.naturalWidth;
  const ph = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, pw, ph);

  const isClear = (x: number, y: number) => data[(y * pw + x) * 4 + 3] < 64;

  // Rows that contain at least one transparent pixel
  const clearRows = new Set<number>();
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      if (isClear(x, y)) { clearRows.add(y); break; }
    }
  }

  // Merge into contiguous y-bands
  const bands: { y1: number; y2: number }[] = [];
  let bandStart: number | null = null;
  for (let y = 0; y <= ph; y++) {
    if (clearRows.has(y) && bandStart === null) { bandStart = y; }
    else if (!clearRows.has(y) && bandStart !== null) {
      bands.push({ y1: bandStart, y2: y - 1 });
      bandStart = null;
    }
  }

  const minH = ph * 0.05; // ignore regions shorter than 5% of image height
  const minW = pw * 0.10; // ignore regions narrower than 10% of image width

  const scaleX = canvasW / pw;
  const scaleY = canvasH / ph;

  return bands
    .filter(b => b.y2 - b.y1 >= minH)
    .map(band => {
      let minX = pw, maxX = 0;
      for (let y = band.y1; y <= band.y2; y++) {
        for (let x = 0; x < pw; x++) {
          if (isClear(x, y)) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }
      }
      return {
        x: Math.round(minX * scaleX),
        y: Math.round(band.y1 * scaleY),
        w: Math.round((maxX - minX + 1) * scaleX),
        h: Math.round((band.y2 - band.y1 + 1) * scaleY),
      };
    })
    .filter(s => s.w >= minW * scaleX);
}
