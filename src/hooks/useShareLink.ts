import { useCallback, useEffect, useState } from 'react';
import { ensureResultBackup, isShareLinkEnabled, type ShareLink } from '@/lib/shareLink';

export type ShareStatus = 'idle' | 'rendering' | 'uploading' | 'ready' | 'error';

interface Params {
  brand: string;
  /** Produce the framed photo blob (PNG). */
  buildPhoto: () => Promise<Blob | null>;
  /** Produce the animated strip blob (MP4), or `null` when there are no clips. */
  buildVideo: () => Promise<Blob | null>;
  /** Whether the result has clips, i.e. an MP4 should be part of the upload. */
  hasVideo: boolean;
  /** True once the result still is rendered and ready to back up. */
  resultReady: boolean;
}

/**
 * Owns the result's R2 upload lifecycle.
 *
 * The upload starts automatically as soon as the result is ready — photo
 * first, then the (slow) MP4 render — so every produced result is backed up
 * to R2 without waiting for the user to share. The backup is silent: `status`
 * stays `idle` until the user asks for the link, at which point the existing
 * upload is reused and the link is typically ready instantly.
 */
export function useShareLink({ brand, buildPhoto, buildVideo, hasVideo, resultReady }: Params) {
  const [status, setStatus] = useState<ShareStatus>('idle');
  const [link, setLink] = useState<ShareLink | null>(null);

  // Silent backup — fire-and-forget, deduped by content hash inside
  // ensureResultBackup so re-renders and screen revisits don't re-upload.
  useEffect(() => {
    if (!resultReady || !isShareLinkEnabled()) return;
    let cancelled = false;
    void (async () => {
      try {
        const photo = await buildPhoto();
        if (!photo || cancelled) return;
        await ensureResultBackup({ photo, brand, buildVideo, wantsVideo: hasVideo });
      } catch {
        // Backup is best-effort; the user-triggered flow surfaces errors.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resultReady, brand, buildPhoto, buildVideo, hasVideo]);

  const create = useCallback(async () => {
    setStatus('rendering');
    setLink(null);
    try {
      const photo = await buildPhoto();
      if (!photo) throw new Error('No photo to share');

      setStatus('uploading');
      const entry = await ensureResultBackup({ photo, brand, buildVideo, wantsVideo: hasVideo });
      setLink(entry.link);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [brand, buildPhoto, buildVideo, hasVideo]);

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
