import { useMemo } from 'react';
import type { Lang } from '@/types';
import type { Translate } from '@/i18n';
import { ACTIVE_DIRECTION } from '@/config/directions';
import { DEFAULT_FILTER } from '@/lib/filters';
import { LAYOUTS } from '@/lib/frames/layouts';
import { skinsFor } from '@/lib/frames/skins';
import { buildFrameInfo } from '@/lib/frames/info';
import { Button } from '@/components/ui';
import { BoothMark, CameraDoodle, HeartSticker, Motif, Swoosh } from '@/components/decor';
import { FramePreview } from '@/components/FramePreview';

interface HomeScreenProps {
  t: Translate;
  lang: Lang;
  brand: string;
  onStart: () => void;
}

export function HomeScreen({ t, lang, brand, onStart }: HomeScreenProps) {
  const skins = useMemo(() => skinsFor(ACTIVE_DIRECTION), []);
  const info = useMemo(() => buildFrameInfo(brand, lang), [brand, lang]);

  return (
    <div
      data-screen-label="Home"
      className="min-h-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-14 px-5 py-6 md:py-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-[calc(2rem+env(safe-area-inset-bottom))]"
    >
      {/* Decorative cluster */}
      <div className="relative hidden md:flex items-center gap-4">
        <div className="rotate-[-5deg]">
          <FramePreview
            layout={LAYOUTS.strip}
            skin={skins[0]}
            shots={[]}
            filter={DEFAULT_FILTER}
            dateStamp={false}
            stickers={[]}
            info={info}
            width={112}
          />
        </div>
        <div className="mt-6">
          <BoothMark width={150} />
        </div>
        <div className="absolute -right-5 -top-5 rotate-[9deg]">
          <HeartSticker width={92} lines={lang === 'id' ? ['foto', 'cantik ♥'] : ['예쁘게', '찍자 ♥']} />
        </div>
        <div className="absolute -left-4 -bottom-4">
          <Motif shape="star" size={36} color="var(--accent2)" opacity={0.9} rotate={-8} />
        </div>
      </div>

      {/* Hero copy */}
      <div className="max-w-md flex flex-col items-center md:items-start gap-4 text-center md:text-left">
        <div className="flex items-center gap-3.5">
          <CameraDoodle size={60} />
          <Motif shape="spark" size={20} color="var(--accent2)" opacity={0.9} />
          <Motif shape="heart" size={16} color="var(--accent)" opacity={0.9} />
        </div>
        <div>
          <h1 className="font-heading text-[clamp(48px,12vw,82px)] m-0 leading-none text-ink tracking-tight">{brand}</h1>
          <div className="flex justify-center md:justify-start">
            <Swoosh width={Math.min(320, Math.max(170, brand.length * 28))} />
          </div>
        </div>
        <p className="font-sans text-lg text-sub m-0 leading-relaxed text-pretty">{t('tagline')}</p>
        <Button big full onClick={onStart} className="max-w-xs">
          {t('start')} →
        </Button>
        <p className="font-sans text-[13.5px] text-sub m-0 opacity-85">{t('heroHint')}</p>
      </div>
    </div>
  );
}
