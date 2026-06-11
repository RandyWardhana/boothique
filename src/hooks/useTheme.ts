import { useMemo } from 'react';
import { ACTIVE_DIRECTION, DIRECTIONS, type Direction } from '@/config/directions';
import { BRANDING, FONT_PAIRS, PALETTES, type PaletteTokens } from '@/config/branding';
import { useSystemTheme } from './useSystemTheme';
import type { ThemePref } from '@/types';

export interface ResolvedTheme {
  direction: Direction;
  isDark: boolean;
  tokens: PaletteTokens;
  /** CSS custom properties to spread onto the app root. */
  vars: Record<string, string>;
}

/**
 * Resolve the active palette, font pairing and light/dark mode into the CSS
 * custom properties the whole UI is themed from. Pure derivation — the only
 * effect involved lives in {@link useSystemTheme}.
 */
export function useTheme(themePref: ThemePref): ResolvedTheme {
  const systemDark = useSystemTheme();
  const isDark = themePref === 'dark' || (themePref === 'system' && systemDark);

  return useMemo<ResolvedTheme>(() => {
    const direction = DIRECTIONS[ACTIVE_DIRECTION];
    const palette = PALETTES[BRANDING.palette] ?? PALETTES.blossom;
    const fonts = FONT_PAIRS[BRANDING.fontPair] ?? FONT_PAIRS.gaegu;

    const base = isDark ? direction.dark : direction.light;
    const overrides = isDark ? palette.dark : palette.light;
    const tokens: PaletteTokens = { ...base, ...overrides };

    const buttonShadow = direction.buttonShadow === 'none' ? 'none' : `${direction.buttonShadow} ${tokens.accent2}`;

    const vars: Record<string, string> = {
      '--bg': tokens.bg,
      '--surface': tokens.surface,
      '--text': tokens.text,
      '--sub': tokens.sub,
      '--border': tokens.border,
      '--accent': tokens.accent,
      '--accent2': tokens.accent2,
      '--on-accent': tokens.onAccent,
      '--frame': tokens.frame || tokens.border,
      '--radius': `${direction.radius}px`,
      '--font-display': fonts.display,
      '--font-body': fonts.body,
      '--btn-shadow': buttonShadow,
    };

    return { direction, isDark, tokens, vars };
  }, [isDark]);
}
