import type { Decor, Skin } from '@/types';

export interface RemoteSkinConfig {
  id: string;
  name: string;
  layoutId: string;
  overlayUrl: string;
}

export function buildSkinFromConfig(config: RemoteSkinConfig): Skin {
  return {
    id: config.id,
    dir: 'custom',
    name: config.name,
    bg: '#f5f0eb',
    overlay: config.overlayUrl,
    layoutId: config.layoutId,
    decor: (): Decor => ({ under: [], over: [] }),
  };
}
