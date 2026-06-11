import { useLayoutEffect } from 'react';

/**
 * Apply the resolved theme CSS variables to the document root so both the
 * Tailwind token mapping (see `index.css`) and any raw `var(--…)` references
 * resolve from `:root`. Cleans up on change/unmount.
 */
export function useThemeVars(vars: Record<string, string>): void {
  useLayoutEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }
    return () => {
      for (const name of Object.keys(vars)) {
        root.style.removeProperty(name);
      }
    };
  }, [vars]);
}
