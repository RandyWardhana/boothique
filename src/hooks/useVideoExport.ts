import { useCallback, useState } from 'react';
import type { FrameOptions } from '@/types';
import { renderVideo } from '@/lib/frames/compose';
import { downloadBlob } from '@/lib/download';

interface Params {
  opts: FrameOptions;
  /** Base filename without extension. */
  fileBase: string;
}

/**
 * Encode and download the animated strip on demand. Exposes encode progress
 * (`null` when idle, `0`–`1` while rendering) and guards against re-entry.
 */
export function useVideoExport({ opts, fileBase }: Params) {
  const [progress, setProgress] = useState<number | null>(null);

  const exportVideo = useCallback(async () => {
    setProgress(0);
    try {
      const result = await renderVideo(opts, setProgress);
      if (result.blob.size) {
        const ext = result.mime.includes('mp4') ? '.mp4' : '.webm';
        downloadBlob(result.blob, `${fileBase}${ext}`);
      }
    } finally {
      setProgress(null);
    }
  }, [opts, fileBase]);

  return { progress, exportVideo };
}
