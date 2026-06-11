import type { Skin } from '@/types';
import { CORE_SKINS } from './core';
import { GIRLIE_SKINS } from './girlie';
import { OCCASION_SKINS } from './occasion';

export { buildSkinFromConfig, type RemoteSkinConfig } from './remote';

/** Every built-in skin, in display order across all collections. */
export const SKINS: Skin[] = [...CORE_SKINS, ...GIRLIE_SKINS, ...OCCASION_SKINS];

let _remoteSkins: Skin[] = [];

/** Called by useRemoteSkins when the Worker manifest is fetched. */
export function registerRemoteSkins(skins: Skin[]): void {
  _remoteSkins = skins;
}

/** Human-readable collection names, keyed by skin `dir`. */
export const COLLECTION_NAMES: Record<string, string> = {
  seoul: 'Seoul Cut',
  occasion: 'Occasions',
  y2k: 'Y2K',
  vintage: 'Vintage Booth',
  instant: 'Instant',
};

/** Order collections are presented in the frame picker. */
export const COLLECTION_ORDER = ['seoul', 'occasion', 'y2k', 'vintage', 'instant'] as const;

/**
 * All skins are usable regardless of the active direction; the matching
 * direction's own skins simply sort first.
 */
export function skinsFor(dir: string): Skin[] {
  const all = [...SKINS, ..._remoteSkins];
  return [...all.filter((s) => s.dir === dir), ...all.filter((s) => s.dir !== dir)];
}

export function getSkin(id: string): Skin {
  return [...SKINS, ..._remoteSkins].find((s) => s.id === id) ?? SKINS[0];
}
