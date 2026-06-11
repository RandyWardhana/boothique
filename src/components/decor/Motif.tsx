import type { CSSProperties } from 'react';

export type MotifShape = 'heart' | 'star' | 'spark' | 'flower' | 'plus' | 'dot' | 'lines';

const PATHS: Record<string, string> = {
  heart: 'M12 21C5 15 2 11 2 7.5 2 4.6 4.4 3 6.8 3 9 3 11 4.6 12 6.2 13 4.6 15 3 17.2 3 19.6 3 22 4.6 22 7.5 22 11 19 15 12 21z',
  star: 'M12 2l2.9 6.2 6.8.6-5.1 4.5 1.5 6.7L12 17.1 5.9 20.5l1.5-6.7L2.3 9.3l6.8-.6z',
  spark: 'M12 1.5C12 7 13 9.5 22 12 13 14.5 12 17 12 22.5 12 17 11 14.5 2 12 11 9.5 12 7 12 1.5z',
  flower:
    'M12 4a3 3 0 013 3 3 3 0 013 3 3 3 0 01-1.8 2.7A3 3 0 0115 16a3 3 0 01-3 1.6A3 3 0 019 16a3 3 0 01-1.2-3.3A3 3 0 016 10a3 3 0 013-3 3 3 0 013-3z',
};

interface MotifProps {
  shape: MotifShape;
  size: number;
  color: string;
  opacity?: number;
  rotate?: number;
  style?: CSSProperties;
}

/** Small decorative glyph used across the backdrop and hero. */
export function Motif({ shape, size, color, opacity, rotate, style }: MotifProps) {
  const transform = rotate ? `rotate(${rotate}deg)` : undefined;
  const wrap: CSSProperties = { opacity, transform, ...style };

  if (shape === 'plus') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} style={wrap}>
        <path d="M12 4v16M4 12h16" stroke={color} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (shape === 'dot') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} style={{ opacity, ...style }}>
        <circle cx="12" cy="12" r="6" fill={color} />
      </svg>
    );
  }
  if (shape === 'lines') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} style={wrap}>
        <path d="M4 8h7M4 13h6M4 18h7" stroke={color} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={wrap}>
      <path d={PATHS[shape] ?? PATHS.heart} fill={color} />
    </svg>
  );
}
