import type { FrameInfo, Lang } from '@/types';
import { dateStampText, longDate } from '../datestamp';

/**
 * Build the caption values a skin interpolates into its decorations. The
 * sub-caption line shows the user's Instagram handle when one is set, otherwise
 * it falls back to the long date.
 */
export function buildFrameInfo(brand: string, lang: Lang, igHandle?: string): FrameInfo {
  return {
    brand,
    date: dateStampText(),
    sub: formatHandle(igHandle) ?? longDate(lang),
  };
}

/**
 * Normalize a user-typed Instagram handle to a `@name` caption, or `null` when
 * empty. Strips a leading `@`, drops characters Instagram doesn't allow, and
 * caps the length so a long handle can't overflow a narrow frame.
 */
export function formatHandle(raw?: string): string | null {
  const handle = (raw ?? '')
    .trim()
    .replace(/^@+/, '')
    .replace(/[^A-Za-z0-9._]/g, '')
    .slice(0, 30);
  return handle ? `@${handle}` : null;
}
