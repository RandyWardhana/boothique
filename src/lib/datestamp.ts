import type { Lang } from '@/types';

/** Compact film-style stamp, e.g. `06 11 '26`. */
export function dateStampText(date = new Date()): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(2);
  return `${mm} ${dd} '${yy}`;
}

/** Long localized date for frame captions, e.g. `June 11, 2026`. */
export function longDate(lang: Lang, date = new Date()): string {
  return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
