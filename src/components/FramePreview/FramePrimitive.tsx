import type { CSSProperties } from 'react';
import type { Prim, Skin } from '@/types';
import { frameFont } from '@/lib/frames/draw';

interface FramePrimitiveProps {
  prim: Prim;
  /** Preview-to-frame scale factor. */
  k: number;
  skin: Skin;
}

/** Render a single decoration primitive as a positioned DOM node. */
export function FramePrimitive({ prim: p, k, skin }: FramePrimitiveProps) {
  if (p.type === 'rect') {
    const style: CSSProperties = {
      position: 'absolute',
      left: p.x * k,
      top: p.y * k,
      width: p.w * k,
      height: p.h * k,
      borderRadius: (p.r ?? 0) * k,
      boxSizing: 'border-box',
      opacity: p.alpha ?? 1,
      transform: p.rotate ? `rotate(${p.rotate}deg)` : undefined,
    };
    if (p.fill && p.fill !== 'none') style.background = p.fill;
    if (p.stroke) {
      style.border = `${Math.max(1, (p.strokeW ?? 2) * k)}px ${p.dash ? 'dashed' : 'solid'} ${p.stroke}`;
    }
    if (p.glow) style.boxShadow = `0 0 ${12 * k}px ${p.glow}, inset 0 0 ${8 * k}px ${p.glow}`;
    return <div style={style} />;
  }

  if (p.type === 'circle') {
    return (
      <div
        style={{
          position: 'absolute',
          left: (p.cx - p.r) * k,
          top: (p.cy - p.r) * k,
          width: p.r * 2 * k,
          height: p.r * 2 * k,
          borderRadius: '50%',
          background: p.fill,
          opacity: p.alpha ?? 1,
        }}
      />
    );
  }

  const translateX = p.align === 'center' ? '-50%' : p.align === 'right' ? '-100%' : '0';
  return (
    <div
      style={{
        position: 'absolute',
        left: p.x * k,
        top: p.y * k,
        transform: `translate(${translateX}, -50%)${p.rotate ? ` rotate(${p.rotate}deg)` : ''}`,
        transformOrigin: p.align === 'center' ? 'center' : 'left center',
        fontSize: p.size * k,
        fontFamily: frameFont(skin, p.font ?? 'body'),
        fontWeight: p.weight ?? 400,
        color: p.color,
        whiteSpace: 'nowrap',
        opacity: p.alpha ?? 1,
        lineHeight: 1,
        textShadow: p.glow ? `0 0 ${p.size * 0.5 * k}px ${p.glow}` : 'none',
      }}
    >
      {p.text}
    </div>
  );
}
