import { useEffect } from 'react';

/** Keep the document background and `theme-color` meta in sync with the theme. */
export function useDocumentChrome(backgroundColor: string): void {
  useEffect(() => {
    document.body.style.background = backgroundColor;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', backgroundColor);
  }, [backgroundColor]);
}
