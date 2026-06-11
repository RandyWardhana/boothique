import { useMemo } from 'react';
import type { Filter, Lang, LayoutId, Shot, Skin } from '@/types';
import type { Translate, TranslationKey } from '@/i18n';
import { FILTER_PRESETS, DEFAULT_FILTER } from '@/lib/filters';
import { LAYOUTS } from '@/lib/frames/layouts';
import { buildFrameInfo } from '@/lib/frames/info';
import { useBeautifiedShots } from '@/hooks/useBeautifiedShots';
import { orderShots } from '@/utils/shots';
import { previewWidth } from '@/utils/preview';
import { ActionBar, Button, Card } from '@/components/ui';
import { FramePreview } from '@/components/FramePreview';
import { cn } from '@/utils/cn';

interface FilterScreenProps {
  t: Translate;
  lang: Lang;
  brand: string;
  shots: Shot[];
  selected: string[];
  layoutId: LayoutId;
  skin: Skin;
  filter: Filter;
  setFilter: (filter: Filter) => void;
  onNext: () => void;
  onBack: () => void;
}

type AdjustKey = 'brightness' | 'contrast' | 'saturation';

export function FilterScreen({ t, lang, brand, shots, selected, layoutId, skin, filter, setFilter, onNext, onBack }: FilterScreenProps) {
  const layout = LAYOUTS[layoutId];
  const ordered = orderShots(shots, selected);
  const beautified = useBeautifiedShots(ordered, filter.beautify);
  const info = useMemo(() => buildFrameInfo(brand, lang), [brand, lang]);
  const sample = ordered[0];

  const renderSlider = (key: AdjustKey, label: string) => (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between font-sans text-[13.5px] font-semibold text-sub">
        <span>{label}</span>
        <span>{filter[key]}%</span>
      </div>
      <input
        type="range"
        min="50"
        max="150"
        value={filter[key]}
        onChange={(e) => setFilter({ ...filter, [key]: Number(e.target.value) })}
        className="w-full"
      />
    </div>
  );

  return (
    <div data-screen-label="Filter" className="min-h-full flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row lg:justify-center lg:items-start gap-6 px-4 py-4">
        <div className="flex justify-center pt-1 shrink-0">
          <FramePreview
            layout={layout}
            skin={skin}
            shots={beautified}
            filter={filter}
            beautify={filter.beautify}
            dateStamp={false}
            stickers={[]}
            info={info}
            width={previewWidth(layout)}
          />
        </div>

        <div className="w-full lg:w-[min(420px,100%)] flex flex-col gap-4">
          <h2 className="font-heading text-3xl text-ink m-0">{t('filterTitle')}</h2>

          <div className="flex gap-2 sm:gap-2.5 flex-wrap">
            {FILTER_PRESETS.map((preset) => {
              const active = filter.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setFilter({ ...filter, preset: preset.id })}
                  className={cn(
                    'flex flex-col gap-1.5 items-center cursor-pointer p-1.5 sm:p-2 bg-surface rounded-[calc(var(--radius)*1.2)] border-2',
                    active ? 'border-accent' : 'border-line',
                  )}
                >
                  {sample ? (
                    <img src={sample.img} alt="" className="w-[60px] h-[45px] sm:w-[72px] sm:h-[54px] object-cover block rounded" style={{ filter: preset.css || 'none' }} />
                  ) : null}
                  <span className={cn('font-sans text-xs font-bold', active ? 'text-ink' : 'text-sub')}>{t(preset.tKey as TranslationKey)}</span>
                </button>
              );
            })}
          </div>

          <Card className="flex flex-col gap-3.5">
            {renderSlider('brightness', t('brightness'))}
            {renderSlider('contrast', t('contrast'))}
            {renderSlider('saturation', t('saturation'))}
            <Button variant="ghost" onClick={() => setFilter({ ...DEFAULT_FILTER, preset: filter.preset })}>
              {t('reset')}
            </Button>
          </Card>
        </div>
      </div>

      <ActionBar onBack={onBack} backLabel={t('back')} onNext={onNext} nextLabel={t('next')} />
    </div>
  );
}
