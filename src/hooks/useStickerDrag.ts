import { useCallback, useRef, type PointerEvent, type RefObject } from 'react';
import type { Layout, Sticker } from '@/types';

interface Params {
  containerRef: RefObject<HTMLElement>;
  /** Preview-to-frame scale factor. */
  scale: number;
  layout: Layout;
  stickers: Sticker[];
  /** Provided only in edit contexts; absence makes stickers read-only. */
  onStickers?: (next: Sticker[]) => void;
}

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

/**
 * Pointer interactions for placed stickers: drag to move (clamped to the frame)
 * and double-tap to remove. When `onStickers` is omitted the preview is
 * read-only and the handlers are inert.
 */
export function useStickerDrag({ containerRef, scale, layout, stickers, onStickers }: Params) {
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const onStickerPointerDown = useCallback(
    (e: PointerEvent, sticker: Sticker) => {
      if (!onStickers || !containerRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = containerRef.current.getBoundingClientRect();
      drag.current = {
        id: sticker.id,
        dx: e.clientX - rect.left - sticker.x * scale,
        dy: e.clientY - rect.top - sticker.y * scale,
      };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [onStickers, containerRef, scale],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = drag.current;
      if (!d || !onStickers || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - d.dx) / scale;
      const y = (e.clientY - rect.top - d.dy) / scale;
      onStickers(
        stickers.map((s) => (s.id === d.id ? { ...s, x: clamp(x, layout.w), y: clamp(y, layout.h) } : s)),
      );
    },
    [onStickers, containerRef, scale, stickers, layout.w, layout.h],
  );

  const onPointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  const removeSticker = useCallback(
    (id: string) => onStickers?.(stickers.filter((s) => s.id !== id)),
    [onStickers, stickers],
  );

  return {
    interactive: Boolean(onStickers),
    onStickerPointerDown,
    onPointerMove,
    onPointerUp,
    removeSticker,
  };
}
