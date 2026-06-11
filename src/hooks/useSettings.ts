import { useEffect, useState } from 'react';
import type { Lang, ThemePref } from '@/types';

export interface Settings {
  lang: Lang;
  theme: ThemePref;
  sound: boolean;
}

const STORAGE_KEY = 'rb-settings';
const DEFAULTS: Settings = { lang: 'en', theme: 'system', sound: true };

function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * Persisted user preferences (language, theme, sound). Returns the current
 * settings and a typed setter for a single key; changes are written through to
 * `localStorage` by an effect.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable — keep in memory only */
    }
  }, [settings]);

  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return { settings, setSetting } as const;
}
