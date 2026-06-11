import type { Layout, LayoutId } from '@/types';

/** Card geometries. Coordinates and sizes are in frame pixels. */
export const LAYOUTS: Record<LayoutId, Layout> = {
  strip: {
    id: 'strip',
    tKey: 'layoutStrip',
    w: 640,
    h: 1920,
    count: 4,
    slots: [
      { x: 44, y: 44, w: 552, h: 414 },
      { x: 44, y: 482, w: 552, h: 414 },
      { x: 44, y: 920, w: 552, h: 414 },
      { x: 44, y: 1358, w: 552, h: 414 },
    ],
    caption: { cx: 320, cy: 1828, size: 64 },
    sub: { cx: 320, cy: 1884, size: 26 },
  },
  grid: {
    id: 'grid',
    tKey: 'layoutGrid',
    w: 1200,
    h: 1180,
    count: 4,
    slots: [
      { x: 44, y: 96, w: 542, h: 406 },
      { x: 614, y: 96, w: 542, h: 406 },
      { x: 44, y: 526, w: 542, h: 406 },
      { x: 614, y: 526, w: 542, h: 406 },
    ],
    header: { cx: 600, cy: 62, size: 34 },
    caption: { cx: 600, cy: 1030, size: 72 },
    sub: { cx: 600, cy: 1100, size: 28 },
  },
  polaroid: {
    id: 'polaroid',
    tKey: 'layoutPolaroid',
    w: 1000,
    h: 1230,
    count: 1,
    slots: [{ x: 56, y: 56, w: 888, h: 888 }],
    caption: { cx: 500, cy: 1070, size: 86 },
    sub: { cx: 500, cy: 1150, size: 30 },
  },
  wide: {
    id: 'wide',
    tKey: 'layoutWide',
    w: 1920,
    h: 660,
    count: 4,
    slots: [
      { x: 50, y: 50, w: 420, h: 560 },
      { x: 494, y: 50, w: 420, h: 560 },
      { x: 938, y: 50, w: 420, h: 560 },
      { x: 1382, y: 50, w: 420, h: 560 },
    ],
    caption: { cx: 1858, cy: 330, size: 54, rotate: 90 },
    sub: null,
  },
  collage: {
    id: 'collage',
    tKey: 'layoutCollage',
    w: 1200,
    h: 1600,
    count: 5,
    slots: [
      { x: 88, y: 108, w: 460, h: 345, rotate: -6, mat: { pad: 18, padBottom: 64 } },
      { x: 658, y: 78, w: 460, h: 345, rotate: 5, mat: { pad: 18, padBottom: 64 } },
      { x: 108, y: 578, w: 460, h: 345, rotate: 4, mat: { pad: 18, padBottom: 64 } },
      { x: 638, y: 548, w: 460, h: 345, rotate: -5, mat: { pad: 18, padBottom: 64 } },
      { x: 368, y: 1028, w: 460, h: 345, rotate: 3, mat: { pad: 18, padBottom: 64 } },
    ],
    caption: { cx: 600, cy: 1500, size: 76 },
    sub: { cx: 600, cy: 1556, size: 28 },
  },
};

export const LAYOUT_ORDER: LayoutId[] = ['strip', 'grid', 'polaroid', 'wide', 'collage'];

export interface ScatterPoint {
  x: number;
  y: number;
  r: number;
}

/**
 * Deterministic pseudo-random scatter across a layout, seeded so a skin's
 * decoration looks the same every render. Uses a Park–Miller LCG.
 */
export function scatter(layout: Layout, count: number, seed = 7): ScatterPoint[] {
  const out: ScatterPoint[] = [];
  let state = seed;
  const rnd = () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    out.push({ x: rnd() * layout.w, y: rnd() * layout.h, r: rnd() });
  }
  return out;
}
