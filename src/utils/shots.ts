import type { Shot } from '@/types';

/** Resolve a selection of shot ids into shots, in selection order. */
export function orderShots(shots: Shot[], selected: string[]): Array<Shot | undefined> {
  return selected.map((id) => shots.find((s) => s.id === id));
}

/** Filename base derived from the brand and today's date, e.g. `boothique-2026-06-11`. */
export function fileBaseName(brand: string): string {
  const slug = brand.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return `${slug}-${new Date().toISOString().slice(0, 10)}`;
}

/** A cheap identity signature for a beautified shot list (used as an effect dep). */
export function beautySignature(shots: Array<Shot | undefined>): string {
  return shots.map((s) => s?.img.length).join(',');
}
