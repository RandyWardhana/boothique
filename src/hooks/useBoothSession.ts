import { useCallback, useState } from 'react';
import type { Filter, LayoutId, Shot, Sticker } from '@/types';
import { DEFAULT_FILTER } from '@/lib/filters';
import { resetResultBackup } from '@/lib/shareLink';

export type Step = 'home' | 'capture' | 'select' | 'edit' | 'frame' | 'result';

/**
 * Owns the whole booth session: the current step plus the photos, layout,
 * selection, filter, frame and stickers being assembled. Keeping it in one hook
 * keeps `App` declarative and gives every screen a single source of truth.
 */
export function useBoothSession() {
  const [step, setStep] = useState<Step>('home');
  const [shots, setShots] = useState<Shot[]>([]);
  const [layoutId, setLayoutId] = useState<LayoutId>('strip');
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>(DEFAULT_FILTER);
  const [skinId, setSkinId] = useState('seo-blush');
  const [dateStamp, setDateStamp] = useState(true);
  const [igHandle, setIgHandle] = useState('');
  const [stickers, setStickers] = useState<Sticker[]>([]);

  /** Drop the session and release any recorded clip URLs. */
  const restart = useCallback(() => {
    setShots((prev) => {
      prev.forEach((s) => {
        if (s.clipUrl) URL.revokeObjectURL(s.clipUrl);
      });
      return [];
    });
    setSelected([]);
    setStickers([]);
    setFilter(DEFAULT_FILTER);
    setIgHandle('');
    // Release this session's R2 folder so the next result uploads a fresh one.
    resetResultBackup();
    setStep('home');
  }, []);

  return {
    step,
    setStep,
    shots,
    setShots,
    layoutId,
    setLayoutId,
    selected,
    setSelected,
    filter,
    setFilter,
    skinId,
    setSkinId,
    dateStamp,
    setDateStamp,
    igHandle,
    setIgHandle,
    stickers,
    setStickers,
    restart,
  };
}

export type BoothSession = ReturnType<typeof useBoothSession>;
