import { useState, type Dispatch, type SetStateAction } from 'react';
import type { Shot } from '@/types';
import type { Translate } from '@/i18n';
import { useCamera } from '@/hooks/useCamera';
import { useCaptureSequence, MAX_SHOTS } from '@/hooks/useCaptureSequence';
import { useSound } from '@/hooks/useSound';
import { ActionBar, Button, Segmented } from '@/components/ui';
import { cn } from '@/utils/cn';

interface CaptureScreenProps {
  t: Translate;
  sound: boolean;
  shots: Shot[];
  setShots: Dispatch<SetStateAction<Shot[]>>;
  onNext: () => void;
  onBack: () => void;
}

type CaptureMode = 'auto' | 'manual';

export function CaptureScreen({ t, sound, shots, setShots, onNext, onBack }: CaptureScreenProps) {
  const [mode, setMode] = useState<CaptureMode>('auto');
  const [autoCount, setAutoCount] = useState(4);
  const [mirror, setMirror] = useState(true);
  const [facing, setFacing] = useState('user');

  const { videoRef, camera, isDemo, permissionDenied, retryCamera } = useCamera(facing);
  const play = useSound(sound);
  const { running, countdown, flash, snapOne, runAuto, stop, removeShot } = useCaptureSequence({
    videoRef,
    camera,
    mirror,
    shots,
    setShots,
    play,
  });

  const full = shots.length >= MAX_SHOTS;

  return (
    <div data-screen-label="Capture" className="min-h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center gap-4 px-4 py-4">
        {/* Camera viewport */}
        <div className="relative w-full max-w-[720px] aspect-[4/3] rounded-[calc(var(--radius)*2)] overflow-hidden bg-[#101015] border-2 border-line">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: mirror ? 'scaleX(-1)' : 'none' }}
          />
          {countdown != null ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 font-heading text-white text-[clamp(96px,28vw,160px)] [text-shadow:0_4px_32px_rgba(0,0,0,0.6)]">
              {countdown}
            </div>
          ) : null}
          {flash ? <div className="absolute inset-0 bg-white opacity-85" /> : null}

          {/* Camera permission blocked overlay */}
          {permissionDenied ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm px-6 text-center">
              <span className="text-4xl">🔒</span>
              <p className="font-sans font-bold text-white text-base m-0 leading-snug">{t('camBlockedTitle')}</p>
              <p className="font-sans text-white/75 text-sm m-0 leading-relaxed">{t('camBlockedBody')}</p>
              <button
                onClick={retryCamera}
                className="mt-1 font-sans font-bold text-sm bg-white text-ink rounded-app px-5 py-2.5 cursor-pointer border-0"
              >
                {t('camRetry')}
              </button>
            </div>
          ) : null}

          <div className="absolute top-3 left-3 flex gap-2 items-center">
            <span className="px-3 py-[5px] rounded-full text-[13px] font-bold font-sans bg-black/55 text-white">
              {t('shotsCount', { n: shots.length })}
            </span>
            {isDemo && !permissionDenied ? (
              <span className="px-3 py-[5px] rounded-full text-[12.5px] font-semibold whitespace-nowrap font-sans bg-[rgba(255,170,40,0.92)] text-[#241a02]">
                {t('demoChip')}
              </span>
            ) : null}
          </div>
        </div>

        {/* Mode + camera controls */}
        <div className="flex gap-3 items-center flex-wrap justify-center">
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as CaptureMode)}
            options={[
              { id: 'auto', label: t('auto') },
              { id: 'manual', label: t('manual') },
            ]}
          />
          {mode === 'auto' ? (
            <Segmented
              small
              value={String(autoCount)}
              onChange={(v) => setAutoCount(Number(v))}
              options={[
                { id: '4', label: '×4' },
                { id: '6', label: '×6' },
                { id: '8', label: '×8' },
              ]}
            />
          ) : null}
          <button
            role="switch"
            aria-checked={mirror}
            onClick={() => setMirror(!mirror)}
            className="flex gap-2 items-center font-sans text-sm font-semibold text-sub cursor-pointer"
          >
            <span className={cn('relative w-9 h-[22px] rounded-full flex-none transition-colors duration-150', mirror ? 'bg-accent' : 'bg-line')}>
              <span className={cn('absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-[left] duration-150', mirror ? 'left-[17px]' : 'left-[3px]')} />
            </span>
            {t('mirror')}
          </button>
          {isDemo ? (
            <Button variant="outline" onClick={retryCamera}>
              {t('demoRetry')}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')}>
              {t('flip')}
            </Button>
          )}
        </div>

        {/* Shutter */}
        <div className="flex gap-3 items-center">
          {mode === 'auto' ? (
            running ? (
              <Button big variant="outline" onClick={stop}>
                {t('stopAuto')}
              </Button>
            ) : (
              <Button big onClick={() => runAuto(autoCount)} disabled={full}>
                {full ? t('rollFull') : t('startAuto')}
              </Button>
            )
          ) : (
            <button
              onClick={() => {
                if (!full) void snapOne();
              }}
              disabled={full}
              aria-label="shutter"
              className={cn(
                'w-[76px] h-[76px] rounded-full border-4 border-ink bg-accent shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-transform active:scale-95',
                full ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
              )}
            />
          )}
        </div>

        {/* Captured roll */}
        {shots.length > 0 ? (
          <div className="flex gap-2 flex-wrap justify-center max-w-[760px]">
            {shots.map((shot) => (
              <div key={shot.id} className="relative">
                <img
                  src={shot.img}
                  alt=""
                  className="w-[72px] h-[54px] sm:w-[88px] sm:h-[66px] object-cover block rounded-[calc(var(--radius)*0.8)] border-2 border-line"
                />
                {shot.clipUrl ? (
                  <span className="absolute left-1 bottom-1 text-[9px] font-extrabold font-sans bg-black/65 text-white px-[5px] py-px rounded tracking-wide">
                    CLIP
                  </span>
                ) : null}
                <button
                  onClick={() => removeShot(shot.id)}
                  aria-label="delete"
                  className="absolute -top-[7px] -right-[7px] w-[22px] h-[22px] rounded-full border-none bg-ink text-base cursor-pointer text-xs leading-none font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <ActionBar onBack={onBack} backLabel={t('back')} onNext={onNext} nextLabel={t('next')} nextDisabled={shots.length < 1} />
    </div>
  );
}
