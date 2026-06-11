import { useCallback } from 'react';
import type { Lang } from '@/types';
import { LANGUAGES, type TranslationKey } from './translations';

export type { TranslationKey } from './translations';

type Vars = Record<string, string | number>;

/**
 * Resolve a translation key for `lang`, falling back to English, and fill any
 * `{placeholder}` tokens from `vars`.
 */
export function translate(lang: Lang, key: TranslationKey, vars?: Vars): string {
  let str = LANGUAGES[lang]?.[key] ?? LANGUAGES.en[key] ?? key;
  if (vars) {
    for (const name of Object.keys(vars)) {
      str = str.split(`{${name}}`).join(String(vars[name]));
    }
  }
  return str;
}

/**
 * Bind {@link translate} to the active language so screens can call `t('key')`.
 */
export function useTranslation(lang: Lang) {
  return useCallback((key: TranslationKey, vars?: Vars) => translate(lang, key, vars), [lang]);
}

export type Translate = ReturnType<typeof useTranslation>;
