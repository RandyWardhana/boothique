import type { Dispatch, SetStateAction } from 'react';
import type { Layout, LayoutId, Shot } from '@/types';
import type { Translate, TranslationKey } from '@/i18n';
import { LAYOUTS, LAYOUT_ORDER } from '@/lib/frames/layouts';
import { ActionBar } from '@/components/ui';
import { cn } from '@/utils/cn';

/** Miniature wireframe of a layout's slots (computed geometry stays inline). */
function LayoutThumb({ layout, active }: { layout: Layout; active: boolean }) {
  const k = 64 / Math.max(layout.w, layout.h);
  return (
    <div
      className={cn('relative mx-auto rounded-[3px] transition-colors', active ? 'bg-accent' : 'bg-line opacity-75')}
      style={{ width: layout.w * k, height: layout.h * k }}
    >
      {layout.slots.map((s, i) => (
        <div
          key={i}
          className="absolute bg-surface rounded-[1.5px]"
          style={{
            left: s.x * k,
            top: s.y * k,
            width: s.w * k,
            height: s.h * k,
            transform: s.rotate ? `rotate(${s.rotate}deg)` : 'none',
          }}
        />
      ))}
    </div>
  );
}

interface SelectScreenProps {
  t: Translate;
  shots: Shot[];
  layoutId: LayoutId;
  setLayoutId: (id: LayoutId) => void;
  selected: string[];
  setSelected: Dispatch<SetStateAction<string[]>>;
  onNext: () => void;
  onBack: () => void;
}

export function SelectScreen({ t, shots, layoutId, setLayoutId, selected, setSelected, onNext, onBack }: SelectScreenProps) {
  const layout = LAYOUTS[layoutId];

  const pickLayout = (id: LayoutId) => {
    setLayoutId(id);
    setSelected((sel) => sel.slice(0, LAYOUTS[id].count));
  };

  const toggle = (id: string) => {
    setSelected((sel) => {
      if (sel.includes(id)) return sel.filter((x) => x !== id);
      if (sel.length >= layout.count) return sel;
      return [...sel, id];
    });
  };

  return (
    <div data-screen-label="Select" className="min-h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center gap-5 px-4 py-4">
        <h2 className="font-heading text-3xl leading-snug text-center w-full text-ink m-0">{t('selectTitle')}</h2>

        {/* Layout chooser — horizontally scrollable on mobile */}
        <div className="flex gap-3 overflow-x-auto max-w-full px-1 pb-1 justify-start sm:justify-center sm:flex-wrap">
          {LAYOUT_ORDER.map((id) => {
            const L = LAYOUTS[id];
            const active = id === layoutId;
            return (
              <button
                key={id}
                onClick={() => pickLayout(id)}
                className={cn(
                  'flex flex-col gap-2 items-center cursor-pointer px-4 pt-3.5 pb-2.5 min-w-[104px] shrink-0 bg-surface rounded-[calc(var(--radius)*1.2)] border-2 transition-colors',
                  active ? 'border-accent shadow-[var(--btn-shadow)]' : 'border-line',
                )}
              >
                <div className="h-16 flex items-center">
                  <LayoutThumb layout={L} active={active} />
                </div>
                <span className={cn('font-sans text-[12.5px] font-bold leading-tight whitespace-nowrap', active ? 'text-ink' : 'text-sub')}>
                  {t(L.tKey as TranslationKey)}
                </span>
                <span className="font-sans text-[11px] leading-none whitespace-nowrap text-sub">
                  {L.count} {L.count > 1 ? 'photos' : 'photo'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="font-sans text-[14.5px] font-semibold text-sub">{t('selectedOf', { a: selected.length, n: layout.count })}</div>

        {/* Photo picker */}
        <div className="flex gap-2.5 sm:gap-3 flex-wrap justify-center max-w-[780px]">
          {shots.map((shot) => {
            const index = selected.indexOf(shot.id);
            const active = index >= 0;
            return (
              <button
                key={shot.id}
                onClick={() => toggle(shot.id)}
                className={cn(
                  'relative p-0 cursor-pointer bg-none rounded-[calc(var(--radius)*1.2)] overflow-hidden border-[3px] transition-[border-color,opacity]',
                  active ? 'border-accent' : 'border-transparent',
                  !active && selected.length >= layout.count ? 'opacity-45' : 'opacity-100',
                )}
              >
                <img src={shot.img} alt="" className="w-[108px] h-[81px] xs:w-[132px] xs:h-[99px] sm:w-[150px] sm:h-[112px] object-cover block" />
                {active ? (
                  <span className="absolute top-1.5 left-1.5 w-[26px] h-[26px] rounded-full bg-accent text-on-accent flex items-center justify-center font-sans font-extrabold text-sm">
                    {index + 1}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <ActionBar
        onBack={onBack}
        backLabel={t('back')}
        onNext={onNext}
        nextLabel={t('next')}
        nextDisabled={selected.length !== layout.count}
      />
    </div>
  );
}
