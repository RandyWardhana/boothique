import type { FrameInfo, Lang } from '@/types';
import { dateStampText, longDate } from '../datestamp';

/** Build the caption/date values a skin interpolates into its decorations. */
export function buildFrameInfo(brand: string, lang: Lang): FrameInfo {
  return { brand, date: dateStampText(), longDate: longDate(lang) };
}
