import { Fragment, useState, type CSSProperties } from 'react';
import { Transition } from '@headlessui/react';
import { Analytics } from '@vercel/analytics/react';
import { BRANDING } from '@/config/branding';
import { getSkin } from '@/lib/frames/skins';
import { useTranslation } from '@/i18n';
import { useDismissBoot } from '@/hooks/useDismissBoot';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { useThemeVars } from '@/hooks/useThemeVars';
import { useDocumentChrome } from '@/hooks/useDocumentChrome';
import { useBoothSession } from '@/hooks/useBoothSession';
import { Backdrop } from '@/components/decor';
import { SettingsPopover, StepBar } from '@/components/ui';
import { CaptureScreen, FilterScreen, FrameScreen, HomeScreen, ResultScreen, SelectScreen } from '@/components/screens';

const brand = BRANDING.brandName;

export default function App() {
  const { settings, setSetting } = useSettings();
  const { lang, theme, sound } = settings;
  const t = useTranslation(lang);

  const { tokens, vars } = useTheme(theme);
  useThemeVars(vars);
  useDocumentChrome(tokens.bg);

  const session = useBoothSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { canInstall, install, dismiss: dismissInstall } = useInstallPrompt();
  useDismissBoot();

  // UI scale stays an inline concern (it zooms the whole app shell).
  const rootStyle: CSSProperties = { zoom: BRANDING.uiScale / 100 };

  return (
    <div style={rootStyle} className="relative h-[100dvh] flex flex-col overflow-hidden bg-base text-ink font-sans">
      <Backdrop />

      <header className="relative z-40 shrink-0 border-b border-line bg-base/80 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 h-14 px-4">
          <button onClick={() => session.setStep('home')} className="flex items-center shrink-0 cursor-pointer" aria-label={brand}>
            <span className="font-heading text-xl text-ink leading-none">{brand}</span>
          </button>

          <div className="flex-1 flex justify-center min-w-0">
            {session.step !== 'home' ? <StepBar step={session.step} t={t} /> : null}
          </div>

          <button
            onClick={() => setSettingsOpen((open) => !open)}
            aria-label={t('settings')}
            className="shrink-0 w-10 h-10 rounded-app cursor-pointer bg-surface border border-line text-ink text-lg leading-none"
          >
            ⚙
          </button>
        </div>
      </header>

      <SettingsPopover
        open={settingsOpen}
        t={t}
        lang={lang}
        theme={theme}
        sound={sound}
        onLang={(v) => setSetting('lang', v)}
        onTheme={(v) => setSetting('theme', v)}
        onSound={(v) => setSetting('sound', v)}
        onClose={() => setSettingsOpen(false)}
      />

      <main className="relative z-10 flex-1 min-h-0 overflow-y-auto flex flex-col">
        {session.step === 'home' ? (
          <HomeScreen
            t={t}
            lang={lang}
            brand={brand}
            onStart={() => session.setStep('capture')}
          />
        ) : null}

        {session.step === 'capture' ? (
          <CaptureScreen
            t={t}
            sound={sound}
            shots={session.shots}
            setShots={session.setShots}
            onNext={() => session.setStep('select')}
            onBack={() => session.setStep('home')}
          />
        ) : null}

        {session.step === 'select' ? (
          <SelectScreen
            t={t}
            shots={session.shots}
            layoutId={session.layoutId}
            setLayoutId={session.setLayoutId}
            selected={session.selected}
            setSelected={session.setSelected}
            onNext={() => session.setStep('edit')}
            onBack={() => session.setStep('capture')}
          />
        ) : null}

        {session.step === 'edit' ? (
          <FilterScreen
            t={t}
            lang={lang}
            brand={brand}
            shots={session.shots}
            selected={session.selected}
            layoutId={session.layoutId}
            skin={getSkin(session.skinId)}
            filter={session.filter}
            setFilter={session.setFilter}
            onNext={() => session.setStep('frame')}
            onBack={() => session.setStep('select')}
          />
        ) : null}

        {session.step === 'frame' ? (
          <FrameScreen
            t={t}
            lang={lang}
            brand={brand}
            shots={session.shots}
            selected={session.selected}
            layoutId={session.layoutId}
            skinId={session.skinId}
            setSkinId={session.setSkinId}
            filter={session.filter}
            dateStamp={session.dateStamp}
            setDateStamp={session.setDateStamp}
            stickers={session.stickers}
            setStickers={session.setStickers}
            onNext={() => session.setStep('result')}
            onBack={() => session.setStep('edit')}
          />
        ) : null}

        {session.step === 'result' ? (
          <ResultScreen
            t={t}
            lang={lang}
            brand={brand}
            shots={session.shots}
            selected={session.selected}
            layoutId={session.layoutId}
            skinId={session.skinId}
            filter={session.filter}
            dateStamp={session.dateStamp}
            stickers={session.stickers}
            onBack={() => session.setStep('frame')}
            onRestart={session.restart}
          />
        ) : null}
      </main>

      {/* PWA install prompt — slides up from bottom, independent of scroll */}
      <Transition
        show={canInstall}
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="translate-y-full opacity-0"
        enterTo="translate-y-0 opacity-100"
        leave="ease-in duration-200"
        leaveFrom="translate-y-0 opacity-100"
        leaveTo="translate-y-full opacity-0"
      >
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-surface border border-line rounded-app px-4 py-3 shadow-xl">
            <img src="/icon.png" alt="" className="w-10 h-10 rounded-[10px] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-bold text-ink m-0 leading-tight">Add to Home Screen</p>
              <p className="font-sans text-xs text-sub m-0 leading-tight mt-0.5">Works like a native app</p>
            </div>
            <button
              onClick={() => void install()}
              className="shrink-0 font-sans font-bold text-[13px] bg-accent text-on-accent rounded-app px-3 py-1.5 cursor-pointer border-0"
            >
              Install
            </button>
            <button
              onClick={dismissInstall}
              className="shrink-0 font-sans text-sub text-xl leading-none cursor-pointer border-0 bg-transparent p-0 w-7 h-7 flex items-center justify-center"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      </Transition>

      <Analytics />
    </div>
  );
}
