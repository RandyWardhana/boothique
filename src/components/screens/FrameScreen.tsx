import { useMemo, type Dispatch, type SetStateAction } from 'react';
import type { Filter, Lang, LayoutId, Shot, Sticker } from '@/types';
import type { Translate } from '@/i18n';
import { ACTIVE_DIRECTION } from '@/config/directions';
import { LAYOUTS } from '@/lib/frames/layouts';
import { COLLECTION_NAMES, COLLECTION_ORDER, getSkin, skinsFor } from '@/lib/frames/skins';
import { buildFrameInfo } from '@/lib/frames/info';
import { STICKER_SETS, type StickerTemplate } from '@/lib/stickers';
import { uid } from '@/lib/canvas';
import { useBeautifiedShots } from '@/hooks/useBeautifiedShots';
import { orderShots } from '@/utils/shots';
import { previewWidth } from '@/utils/preview';
import { ActionBar, Card, ToggleRow } from '@/components/ui';
import { FramePreview } from '@/components/FramePreview';
import { cn } from '@/utils/cn';

interface FrameScreenProps {
  t: Translate;
  lang: Lang;
  brand: string;
  shots: Shot[];
  selected: string[];
  layoutId: LayoutId;
  skinId: string;
  setSkinId: (id: string) => void;
  filter: Filter;
  dateStamp: boolean;
  setDateStamp: (value: boolean) => void;
  stickers: Sticker[];
  setStickers: Dispatch<SetStateAction<Sticker[]>>;
  onNext: () => void;
  onBack: () => void;
}

export function FrameScreen({
  t,
  lang,
  brand,
  shots,
  selected,
  layoutId,
  skinId,
  setSkinId,
  filter,
  dateStamp,
  setDateStamp,
  stickers,
  setStickers,
  onNext,
  onBack,
}: FrameScreenProps) {
  const layout = LAYOUTS[layoutId];
  const skins = useMemo(() => skinsFor(ACTIVE_DIRECTION), []);
  const skin = getSkin(skinId);
  const ordered = orderShots(shots, selected);
  const beautified = useBeautifiedShots(ordered, filter.beautify);
  const info = useMemo(() => buildFrameInfo(brand, lang), [brand, lang]);
  const thumbW = previewWidth(layout, 100);

  const addSticker = (base: StickerTemplate) => {
    const sticker: Sticker = {
      id: uid(),
      text: base.text,
      color: base.color,
      x: layout.w * (0.3 + Math.random() * 0.4),
      y: layout.h * (0.25 + Math.random() * 0.4),
      size: Math.round(layout.w * 0.1),
      rotate: Math.round(-18 + Math.random() * 36),
      font: 'display',
      glow: ACTIVE_DIRECTION === 'y2k',
    };
    setStickers((prev) => [...prev, sticker]);
  };

  return (
    <div data-screen-label="Frame" className="min-h-full flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row lg:justify-center lg:items-start gap-6 px-4 py-4">
        <div className="flex justify-center pt-1 shrink-0">
          <FramePreview
            layout={layout}
            skin={skin}
            shots={beautified}
            filter={filter}
            beautify={filter.beautify}
            dateStamp={dateStamp}
            stickers={stickers}
            info={info}
            width={previewWidth(layout, 320)}
            onStickers={(next) => setStickers(next)}
          />
        </div>

        <div className="w-full lg:w-[min(420px,100%)] flex flex-col gap-4">
          <h2 className="font-heading text-3xl text-ink m-0">{t('frameTitle')}</h2>

          <div className="flex flex-col gap-4 max-h-[38vh] sm:max-h-[440px] overflow-y-auto pr-1.5">
            {COLLECTION_ORDER.map((collection) => {
              const group = skins.filter((s) => s.dir === collection);
              if (!group.length) return null;
              return (
                <div key={collection} className="flex flex-col gap-2">
                  <div className="font-sans text-xs font-bold text-sub uppercase tracking-wide">{COLLECTION_NAMES[collection]}</div>
                  <div className="flex gap-3 flex-wrap">
                    {group.map((s) => {
                      const active = s.id === skin.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSkinId(s.id)}
                          className={cn(
                            'flex flex-col gap-2 items-center cursor-pointer p-2.5 bg-surface rounded-[calc(var(--radius)*1.2)] border-2',
                            active ? 'border-accent' : 'border-line',
                          )}
                        >
                          <FramePreview
                            layout={layout}
                            skin={s}
                            shots={beautified}
                            filter={filter}
                            beautify={filter.beautify}
                            dateStamp={false}
                            stickers={[]}
                            info={info}
                            width={thumbW}
                          />
                          <span className={cn('font-sans text-[12.5px] font-bold', active ? 'text-ink' : 'text-sub')}>{s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="flex flex-col gap-3">
            <ToggleRow label={t('dateStamp')} value={dateStamp} onChange={setDateStamp} />
            <div>
              <div className="font-sans text-xs font-bold text-sub uppercase tracking-wide mb-2">{t('stickers')}</div>
              <div className="flex gap-2 flex-wrap">
                {(STICKER_SETS[ACTIVE_DIRECTION] ?? []).map((sticker, i) => (
                  <button
                    key={i}
                    onClick={() => addSticker(sticker)}
                    className="w-13 h-13 cursor-pointer text-xl font-bold font-heading bg-base border border-line rounded-app flex items-center justify-center"
                    style={{ color: sticker.color }}
                  >
                    {sticker.text}
                  </button>
                ))}
              </div>
              <p className="font-sans text-[12.5px] text-sub mt-2.5 mb-0 leading-relaxed">{t('stickerHint')}</p>
            </div>
          </Card>
        </div>
      </div>

      <ActionBar onBack={onBack} backLabel={t('back')} onNext={onNext} nextLabel={t('done')} />
    </div>
  );
}
