import type { FontRole, Layout, Prim, RectPrim, TextPrim } from '@/types';

/**
 * Shared decoration builders used by every skin pack: the caption, the optional
 * sub-caption, and inset border rectangles. Keeping these in one place means a
 * caption looks identical across collections regardless of which pack defines
 * the skin.
 */

export function captionText(
  layout: Layout,
  text: string,
  color: string,
  font: FontRole = 'display',
  extra: Partial<TextPrim> = {},
): TextPrim {
  const c = layout.caption;
  return {
    type: 'text',
    x: c.cx,
    y: c.cy,
    text,
    size: c.size,
    color,
    font,
    align: 'center',
    rotate: c.rotate ?? 0,
    ...extra,
  };
}

export function subText(
  layout: Layout,
  text: string,
  color: string,
  extra: Partial<TextPrim> = {},
): TextPrim | null {
  if (!layout.sub) return null;
  const c = layout.sub;
  return {
    type: 'text',
    x: c.cx,
    y: c.cy,
    text,
    size: c.size,
    color,
    font: 'body',
    align: 'center',
    ...extra,
  };
}

export function borderRect(
  layout: Layout,
  inset: number,
  stroke: string,
  strokeW: number,
  extra: Partial<RectPrim> = {},
): RectPrim {
  return {
    type: 'rect',
    x: inset,
    y: inset,
    w: layout.w - inset * 2,
    h: layout.h - inset * 2,
    stroke,
    strokeW,
    fill: 'none',
    ...extra,
  };
}

/** Drop nulls so optional prims (like a missing sub-caption) can be inlined. */
export function compact(prims: Array<Prim | null>): Prim[] {
  return prims.filter((p): p is Prim => p !== null);
}

/** Stamp-style sub-caption size: a touch larger when the layout has no sub line. */
export function stampSize(layout: Layout): number {
  return layout.sub ? layout.sub.size + 6 : 30;
}
