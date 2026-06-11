import { useCallback } from 'react';
import { sound, type SoundEffect } from '@/lib/sound';

/** Return a `play(effect)` callback that no-ops when sound is disabled. */
export function useSound(enabled: boolean) {
  return useCallback(
    (effect: SoundEffect) => {
      if (enabled) sound[effect]();
    },
    [enabled],
  );
}
