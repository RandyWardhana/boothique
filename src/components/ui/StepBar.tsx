import { cn } from '@/utils/cn';
import type { Translate, TranslationKey } from '@/i18n';
import type { Step } from '@/hooks/useBoothSession';

const STEPS: Exclude<Step, 'home'>[] = ['capture', 'select', 'edit', 'frame', 'result'];

const STEP_LABELS: Record<Exclude<Step, 'home'>, TranslationKey> = {
  capture: 'stepCapture',
  select: 'stepSelect',
  edit: 'stepEdit',
  frame: 'stepFrame',
  result: 'stepResult',
};

interface StepBarProps {
  step: Step;
  t: Translate;
}

/**
 * Progress indicator across the five booth steps. A compact dot strip on small
 * screens, the full labelled breadcrumb from `sm` up.
 */
export function StepBar({ step, t }: StepBarProps) {
  const current = STEPS.indexOf(step as Exclude<Step, 'home'>);

  return (
    <>
      {/* Compact (mobile) */}
      <div className="flex sm:hidden items-center gap-2">
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                'h-1.5 rounded-full transition-all duration-200',
                i <= current ? 'bg-accent' : 'bg-line',
                i === current ? 'w-5' : 'w-1.5',
              )}
            />
          ))}
        </div>
        <span className="font-sans text-xs font-bold text-ink">{t(STEP_LABELS[STEPS[current] ?? 'capture'])}</span>
      </div>

      {/* Full (desktop) */}
      <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-center">
        {STEPS.map((s, i) => {
          const active = i === current;
          const past = i < current;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full font-sans text-[12.5px] font-bold border',
                  active
                    ? 'bg-accent text-on-accent border-accent'
                    : cn('bg-transparent border-transparent', past ? 'text-ink' : 'text-sub opacity-60', past && 'border-line'),
                )}
              >
                <span>{i + 1}</span>
                <span>{t(STEP_LABELS[s])}</span>
              </div>
              {i < STEPS.length - 1 ? <div className="w-3 h-px bg-line" /> : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
