import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import type { Lang, ThemePref } from '@/types';
import type { Translate } from '@/i18n';
import { Segmented } from './Segmented';
import { ToggleRow } from './ToggleRow';

interface SettingsPopoverProps {
  open: boolean;
  t: Translate;
  lang: Lang;
  theme: ThemePref;
  sound: boolean;
  onLang: (lang: Lang) => void;
  onTheme: (theme: ThemePref) => void;
  onSound: (sound: boolean) => void;
  onClose: () => void;
}

const LABEL = 'font-sans text-xs font-bold text-sub mb-1.5 uppercase tracking-wide';

/** Settings bottom sheet powered by Headless UI Dialog. */
export function SettingsPopover({ open, t, lang, theme, sound, onLang, onTheme, onSound, onClose }: SettingsPopoverProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        </TransitionChild>

        {/* Sheet panel slides up from the bottom */}
        <div className="fixed inset-x-0 bottom-0">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <DialogPanel className="w-full rounded-t-3xl bg-surface border-t border-line shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom)]">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-line" />
              </div>

              <div className="px-6 pt-3 pb-6 flex flex-col gap-5">
                <DialogTitle className="font-heading text-2xl text-ink m-0">{t('settings')}</DialogTitle>

                <div>
                  <div className={LABEL}>{t('language')}</div>
                  <Segmented
                    value={lang}
                    onChange={(v) => onLang(v as Lang)}
                    options={[
                      { id: 'en', label: 'English' },
                      { id: 'id', label: 'Indonesia' },
                    ]}
                  />
                </div>

                <div>
                  <div className={LABEL}>{t('theme')}</div>
                  <Segmented
                    value={theme}
                    onChange={(v) => onTheme(v as ThemePref)}
                    options={[
                      { id: 'light', label: t('themeLight') },
                      { id: 'dark', label: t('themeDark') },
                      { id: 'system', label: t('themeSystem') },
                    ]}
                  />
                </div>

                <ToggleRow label={t('sound')} value={sound} onChange={onSound} />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
