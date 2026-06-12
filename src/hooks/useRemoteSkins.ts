import { useEffect, useState } from 'react';
import type { LayoutId, Skin } from '@/types';
import { buildSkinFromConfig, registerRemoteSkins, type RemoteSkinConfig } from '@/lib/frames/skins';
import { LAYOUTS } from '@/lib/frames/layouts';
import { detectSlotsFromOverlay } from '@/lib/frames/skins/detectSlots';

/**
 * Fetch the Worker's custom skin manifest on mount, auto-detect each skin's
 * photo slot positions from the overlay PNG's transparent regions, register
 * them for getSkin() lookups, and return the skins for reactive rendering.
 */
export function useRemoteSkins(): Skin[] {
  const [skins, setSkins] = useState<Skin[]>([]);

  useEffect(() => {
    const base = import.meta.env.VITE_SHARE_API_BASE as string | undefined;
    if (!base) return;

    void (async () => {
      try {
        const r = await fetch(`${base}/api/skins`);
        const configs: RemoteSkinConfig[] = r.ok
          ? await (r.json() as Promise<RemoteSkinConfig[]>)
          : [];

        const built = configs.map(buildSkinFromConfig);

        await Promise.all(
          built.map(async (skin, i) => {
            const config = configs[i];
            const layout = LAYOUTS[config.layoutId as LayoutId];
            if (!skin.overlay || !layout) return;
            try {
              const detected = await detectSlotsFromOverlay(skin.overlay, layout.w, layout.h);
              if (detected.length > 0) skin.customSlots = detected;
            } catch {
              // CORS or load failure — fall back to the layout's default slots
            }
          }),
        );

        registerRemoteSkins(built);
        setSkins([...built]);
      } catch {
        // Network error — leave skins empty
      }
    })();
  }, []);

  return skins;
}
