import { useEffect, useRef, useState } from 'react';
import type { FrameOptions } from '@/types';
import { renderStill } from '@/lib/frames/compose';

interface StillImage {
  /** PNG data URL of the rendered card, or `null` while rendering. */
  url: string | null;
  /** The source canvas, for downloads and sharing. */
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

/**
 * Render the framed still whenever the supplied `signature` changes (a cheap
 * stand-in for deep-comparing the frame options), exposing both the preview URL
 * and the underlying canvas for export.
 */
export function useStillImage(opts: FrameOptions, signature: string): StillImage {
  const [url, setUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    renderStill(opts).then((canvas) => {
      if (!alive) return;
      canvasRef.current = canvas;
      setUrl(canvas.toDataURL('image/png'));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { url, canvasRef };
}
