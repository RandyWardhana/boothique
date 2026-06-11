import { useCallback, useState } from 'react';
import { createShareLink, type ShareLink } from '@/lib/shareLink';

export type ShareStatus = 'idle' | 'rendering' | 'uploading' | 'ready' | 'error';

interface Params {
  brand: string;
  /** Produce the framed photo blob (PNG). */
  buildPhoto: () => Promise<Blob | null>;
  /** Produce the animated strip blob (MP4), or `null` when there are no clips. */
  buildVideo: () => Promise<Blob | null>;
}

/**
 * Create a 72-hour share link for the current result: render the photo (and
 * video, if any), upload them, and expose the resulting link. The render step
 * is the slow part, so `status` distinguishes `rendering` from `uploading` for
 * the UI.
 */
export function useShareLink({ brand, buildPhoto, buildVideo }: Params) {
  const [status, setStatus] = useState<ShareStatus>('idle');
  const [link, setLink] = useState<ShareLink | null>(null);

  const create = useCallback(async () => {
    setStatus('rendering');
    setLink(null);
    try {
      const photo = await buildPhoto();
      if (!photo) throw new Error('No photo to share');
      const video = await buildVideo();

      setStatus('uploading');
      const result = await createShareLink({ photo, video, brand });
      setLink(result);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [brand, buildPhoto, buildVideo]);

  const reset = useCallback(() => {
    setStatus('idle');
    setLink(null);
  }, []);

  return {
    status,
    link,
    create,
    reset,
    busy: status === 'rendering' || status === 'uploading',
  };
}
