import type { ReactNode } from 'react';
import { Button, type ButtonVariant } from './Button';

/**
 * Sticky bottom container that keeps its actions within thumb reach on mobile,
 * with safe-area padding for notched devices. Sits inside the scrolling main so
 * it floats above content at the bottom of the viewport.
 */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-30 w-full px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-xl items-center gap-3 bg-base/90 backdrop-blur-md border border-line rounded-2xl shadow-xl px-4 py-3">
        {children}
      </div>
    </div>
  );
}

interface ActionBarProps {
  onBack?: () => void;
  backLabel?: string;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  nextVariant?: ButtonVariant;
}

/** Back + Next, each taking 50 % of the bar width. */
export function ActionBar({ onBack, backLabel, onNext, nextLabel, nextDisabled, nextVariant = 'accent2' }: ActionBarProps) {
  return (
    <BottomBar>
      {onBack ? (
        <Button variant="outline" onClick={onBack} big className="flex-1">
          ← {backLabel}
        </Button>
      ) : null}
      <Button variant={nextVariant} onClick={onNext} disabled={nextDisabled} big className="flex-1">
        {nextLabel} →
      </Button>
    </BottomBar>
  );
}
