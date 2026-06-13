import { useLayoutEffect } from 'react';

/**
 * Applies the default blossom theme tokens to `:root` for standalone pages
 * (share, not-found) that render outside `App` and its theme system, so the
 * Tailwind tokens (`bg-base`, `text-ink`, …) resolve there too.
 */
export function useStandaloneTheme(): void {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const vars: Record<string, string> = {
      '--bg': '#fdf4ee',
      '--surface': '#fffaf6',
      '--text': '#5b4a78',
      '--sub': '#a692bd',
      '--border': '#f3dbe4',
      '--accent': '#ef9fbd',
      '--accent2': '#b79fe0',
      '--on-accent': '#5a3550',
      '--frame': '#f6d6df',
      '--radius': '18px',
      '--font-display': "'Gaegu', cursive",
      '--font-body': "'Gaegu', cursive",
      '--btn-shadow': 'none',
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    document.body.style.background = '#fdf4ee';
  }, []);
}
