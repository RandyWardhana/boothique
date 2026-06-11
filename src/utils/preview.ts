import type { Layout } from '@/types';

/**
 * Pick a preview width that fits comfortably on a phone while respecting the
 * layout's aspect ratio. Landscape-ish layouts are capped harder than tall
 * ones so a wide strip never overflows a narrow screen.
 */
export function previewWidth(layout: Layout, cap = 300): number {
  const natural = layout.w >= layout.h ? 460 : Math.round((380 * layout.w) / layout.h);
  return Math.min(cap, natural);
}
