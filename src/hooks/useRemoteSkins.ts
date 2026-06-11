import { useEffect, useState } from 'react';
import type { Skin } from '@/types';
import { buildSkinFromConfig, registerRemoteSkins, type RemoteSkinConfig } from '@/lib/frames/skins';

/**
 * Fetch the Worker's custom skin manifest on mount, register them for getSkin()
 * lookups, and return the loaded skins for reactive rendering in FrameScreen.
 */
export function useRemoteSkins(): Skin[] {
  const [skins, setSkins] = useState<Skin[]>([]);

  useEffect(() => {
    const base = import.meta.env.VITE_SHARE_API_BASE as string | undefined;
    if (!base) return;
    fetch(`${base}/api/skins`)
      .then((r) => (r.ok ? (r.json() as Promise<RemoteSkinConfig[]>) : Promise.resolve([])))
      .then((configs) => {
        const built = configs.map(buildSkinFromConfig);
        registerRemoteSkins(built);
        setSkins(built);
      })
      .catch(() => {});
  }, []);

  return skins;
}
