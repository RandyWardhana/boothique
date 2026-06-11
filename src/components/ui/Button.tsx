import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'accent2';

interface ButtonProps {
  variant?: ButtonVariant;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  full?: boolean;
  big?: boolean;
  className?: string;
  'aria-label'?: string;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent shadow-[var(--btn-shadow)]',
  outline: 'bg-transparent text-ink border-line',
  ghost: 'bg-transparent text-sub',
  accent2: 'bg-accent2 text-on-accent shadow-[var(--btn-shadow)]',
};

/** Themed button with thumb-friendly tap targets. */
export function Button({
  variant = 'primary',
  children,
  onClick,
  disabled,
  full,
  big,
  className,
  'aria-label': ariaLabel,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-sans font-bold leading-tight rounded-app',
        'border-2 border-transparent transition-[transform,box-shadow,background,filter] duration-150',
        'disabled:opacity-45 disabled:cursor-not-allowed',
        'enabled:cursor-pointer enabled:hover:-translate-y-px enabled:hover:brightness-105 enabled:active:translate-y-px enabled:active:brightness-95',
        big ? 'px-8 py-4 text-lg min-h-14' : 'px-5 py-2.5 text-[15px]',
        full && 'w-full',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
