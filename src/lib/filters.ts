import type { Filter, FilterPreset } from '@/types';

/** Selectable filter presets; the CSS string is also used for thumbnails. */
export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'none', tKey: 'fNone', css: '' },
  { id: 'film', tKey: 'fFilm', css: 'sepia(0.18) contrast(1.08) brightness(1.04) saturate(1.15)' },
  { id: 'bw', tKey: 'fBw', css: 'grayscale(1) contrast(1.15) brightness(1.02)' },
  { id: 'sepia', tKey: 'fSepia', css: 'sepia(0.55) contrast(1.05) brightness(1.05)' },
  { id: 'cool', tKey: 'fCool', css: 'saturate(1.08) hue-rotate(-10deg) brightness(1.04)' },
  { id: 'soft', tKey: 'fSoft', css: 'brightness(1.1) contrast(0.9) saturate(1.05)' },
  { id: 'vivid', tKey: 'fVivid', css: 'saturate(1.45) contrast(1.1)' },
];

export const DEFAULT_FILTER: Filter = {
  preset: 'none',
  brightness: 100,
  contrast: 100,
  saturation: 100,
  beautify: 0,
};

/** Compose a CSS `filter` string from a preset plus the manual adjustments. */
export function filterToCss(filter: Filter): string {
  const preset = FILTER_PRESETS.find((p) => p.id === filter.preset) ?? FILTER_PRESETS[0];
  const parts: string[] = [];
  if (preset.css) parts.push(preset.css);
  if (filter.brightness !== 100) parts.push(`brightness(${filter.brightness / 100})`);
  if (filter.contrast !== 100) parts.push(`contrast(${filter.contrast / 100})`);
  if (filter.saturation !== 100) parts.push(`saturate(${filter.saturation / 100})`);
  return parts.join(' ') || 'none';
}

/**
 * CSS soft-focus approximation of skin smoothing. Stills get true pixel-level
 * smoothing (see `beautify.ts`); live video uses this cheaper CSS version.
 */
export function beautifyCss(amount: number): string {
  const a = Math.max(0, Math.min(1, amount / 100));
  if (!a) return '';
  return `blur(${(a * 1.5).toFixed(2)}px) brightness(${(1 + a * 0.05).toFixed(3)}) saturate(${(1 - a * 0.04).toFixed(3)})`;
}
