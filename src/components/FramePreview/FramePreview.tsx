import { useMemo, useRef } from 'react';
import type { Filter, FrameInfo, Layout, Shot, Skin, Sticker } from '@/types';
import { frameFont } from '@/lib/frames/draw';
import { useStickerDrag } from '@/hooks/useStickerDrag';
import { FramePrimitive } from './FramePrimitive';
import { FrameSlot } from './FrameSlot';

export interface FramePreviewProps {
  layout: Layout;
  skin: Skin;
  shots: Array<Shot | undefined>;
  filter: Filter;
  beautify?: number;
  dateStamp: boolean;
  stickers: Sticker[];
  info: FrameInfo;
  /** Rendered preview width in pixels; height follows the layout aspect. */
  width: number;
  animated?: boolean;
  /** When provided, stickers become interactive (drag / double-tap to remove). */
  onStickers?: (next: Sticker[]) => void;
}

/**
 * A live DOM rendering of a frame spec, visually matching the canvas export.
 * Pointer interactions for stickers are owned by {@link useStickerDrag}.
 */
export function FramePreview({
  layout,
  skin,
  shots,
  filter,
  beautify,
  dateStamp,
  stickers,
  info,
  width,
  animated,
  onStickers,
}: FramePreviewProps) {
  const k = width / layout.w;
  const ref = useRef<HTMLDivElement>(null);
  const decor = useMemo(() => skin.decor(layout, info), [skin, layout, info]);
  const background =
    typeof skin.bg === 'object' && skin.bg.grad
      ? `linear-gradient(180deg, ${skin.bg.grad[0]}, ${skin.bg.grad[1]})`
      : typeof skin.bg === 'string'
        ? skin.bg
        : '#ffffff';

  const drag = useStickerDrag({ containerRef: ref, scale: k, layout, stickers, onStickers });

  return (
    <div
      ref={ref}
      className="fp-root"
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      style={{
        position: 'relative',
        width: layout.w * k,
        height: layout.h * k,
        background,
        overflow: 'hidden',
        flex: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        borderRadius: 4,
      }}
    >
      {decor.under.map((p, i) => (
        <FramePrimitive key={`u${i}`} prim={p} k={k} skin={skin} />
      ))}

      {layout.slots.map((slot, i) => (
        <FrameSlot
          key={i}
          slot={slot}
          k={k}
          skin={skin}
          shot={shots[i]}
          filter={filter}
          beautify={beautify}
          dateStamp={dateStamp}
          info={info}
          animated={animated}
        />
      ))}

      {decor.over.map((p, i) => (
        <FramePrimitive key={`o${i}`} prim={p} k={k} skin={skin} />
      ))}

      {skin.overlay && (
        <img
          src={skin.overlay}
          aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
      )}

      {stickers.map((st) => (
        <div
          key={st.id}
          onPointerDown={(e) => drag.onStickerPointerDown(e, st)}
          onDoubleClick={() => drag.removeSticker(st.id)}
          style={{
            position: 'absolute',
            left: st.x * k,
            top: st.y * k,
            transform: `translate(-50%,-50%)${st.rotate ? ` rotate(${st.rotate}deg)` : ''}`,
            fontSize: st.size * k,
            fontFamily: frameFont(skin, st.font ?? 'display'),
            fontWeight: 700,
            color: st.color,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textShadow: st.glow ? `0 0 ${st.size * 0.4 * k}px ${st.color}` : 'none',
            cursor: drag.interactive ? 'grab' : 'default',
            userSelect: 'none',
            touchAction: 'none',
            outline: drag.interactive ? '1px dashed rgba(127,127,127,0.5)' : 'none',
            outlineOffset: 4,
          }}
        >
          {st.text}
        </div>
      ))}
    </div>
  );
}
