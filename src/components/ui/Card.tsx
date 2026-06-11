import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** Surface container with the themed border and rounded corners. */
export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-surface border border-line rounded-[calc(var(--radius)*1.5)] p-5', className)}>
      {children}
    </div>
  );
}
