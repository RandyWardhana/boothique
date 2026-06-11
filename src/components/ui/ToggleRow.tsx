import { cn } from '@/utils/cn';

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/** Full-width label + switch row. */
export function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      className="flex items-center justify-between gap-2.5 w-full py-1.5 cursor-pointer font-sans text-sm font-semibold text-ink"
    >
      <span>{label}</span>
      <span
        className={cn(
          'relative w-10 h-[22px] rounded-full flex-none transition-colors duration-150',
          value ? 'bg-accent' : 'bg-line',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-[left] duration-150',
            value ? 'left-[21px]' : 'left-[3px]',
          )}
        />
      </span>
    </button>
  );
}
