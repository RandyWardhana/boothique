import { cn } from '@/utils/cn';

export interface SegmentOption {
  id: string;
  label: string;
}

interface SegmentedProps {
  options: SegmentOption[];
  value: string;
  onChange: (id: string) => void;
  small?: boolean;
}

/** Segmented control — a small pill group with one active option. */
export function Segmented({ options, value, onChange, small }: SegmentedProps) {
  return (
    <div className="inline-flex gap-1 p-1 bg-surface border border-line rounded-app">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'cursor-pointer font-sans font-semibold rounded-[calc(var(--radius)-3px)] transition-colors duration-150',
              small ? 'text-[13px] px-3 py-1.5' : 'text-sm px-4 py-2',
              active ? 'bg-accent text-on-accent' : 'bg-transparent text-sub',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
