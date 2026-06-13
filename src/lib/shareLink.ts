/**
 * Client for the share Worker: uploads a result and returns a public link that
 * stays live for 72 hours. When `VITE_SHARE_API_BASE` is unset the feature is
 * disabled and the UI falls back to native file sharing.
 */

const API_BASE = import.meta.env.VITE_SHARE_API_BASE?.replace(/\/$/, '');

export interface ShareLink {
  id: string;
  url: string;
  /** Epoch milliseconds when the link stops working. */
  expiresAt: number;
}

/** Whether a share Worker is configured. */
export function isShareLinkEnabled(): boolean {
  return Boolean(API_BASE);
}

interface CreateShareInput {
  photo: Blob;
  video?: Blob | null;
  brand: string;
}

/** Upload the result and get back its 72-hour link. */
export async function createShareLink({ photo, video, brand }: CreateShareInput): Promise<ShareLink> {
  if (!API_BASE) throw new Error('Share link service is not configured');

  const form = new FormData();
  form.append('photo', photo, 'photo.png');
  if (video) form.append('video', video, 'video.mp4');
  form.append('brand', brand);

  const response = await fetch(`${API_BASE}/api/share`, { method: 'POST', body: form });
  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }
  const data = (await response.json()) as ShareLink;
  // Construct the share URL from the app's own origin so it points to Vercel
  // (or wherever the app is hosted) rather than the Worker domain.
  return { ...data, url: `${window.location.origin}/s/${data.id}` };
}

/** Replace an existing share's photo (and reset its video) in place, reusing the
 *  same id/link. Used when the user steps back, adjusts the result and returns —
 *  the folder is updated rather than a new one created. */
export async function replaceShareResult(id: string, { photo, brand }: { photo: Blob; brand: string }): Promise<void> {
  if (!API_BASE) throw new Error('Share link service is not configured');

  const form = new FormData();
  form.append('photo', photo, 'photo.png');
  form.append('brand', brand);

  const response = await fetch(`${API_BASE}/api/share/${id}`, { method: 'PUT', body: form });
  if (!response.ok) {
    throw new Error(`Replace failed (${response.status})`);
  }
}

/** Attach the animated MP4 to an already-uploaded share. Idempotent on the
 *  Worker side — an existing video is never overwritten. */
export async function attachShareVideo(id: string, video: Blob): Promise<void> {
  if (!API_BASE) throw new Error('Share link service is not configured');

  const form = new FormData();
  form.append('video', video, 'video.mp4');

  const response = await fetch(`${API_BASE}/api/share/${id}/video`, { method: 'POST', body: form });
  if (!response.ok) {
    throw new Error(`Video attach failed (${response.status})`);
  }
}

/* ------------------------------ result backup ------------------------------ */

interface BackupEntry {
  link: ShareLink;
  /** True once the MP4 is attached (or the result has no clips). */
  videoDone: boolean;
}

interface EnsureBackupInput {
  photo: Blob;
  brand: string;
  /** Render the MP4, or resolve null when the result has no clips. */
  buildVideo: () => Promise<Blob | null>;
  wantsVideo: boolean;
}

// One R2 folder per booth session. `current` holds that folder's share link
// plus the hash of the photo currently stored in it, so revisiting the result
// with the same render is a no-op while revisiting after the user adjusts the
// result replaces the photo/video in place. Reset on restart (see
// resetResultBackup) — a new session is a new folder.
let current: { link: ShareLink; photoHash: string; videoDone: boolean } | null = null;
// Serializes create/replace/attach so the silent auto-backup and a user's share
// tap can't race into two folders or a torn update.
let lock: Promise<unknown> = Promise.resolve();

async function hashBlob(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Drop the current session's backup so the next result starts a fresh folder.
 *  Call when the booth session restarts. */
export function resetResultBackup(): void {
  current = null;
}

/**
 * Back the current result up to R2, reusing this session's single folder.
 *
 * First call creates the folder (photo first so the backup lands even if the
 * slow video render never finishes, then the MP4 is attached). Later calls with
 * the same photo are a no-op; later calls with a different photo — the user
 * stepped back, adjusted and returned — replace the photo and video in place.
 * Returns the share link for the folder.
 *
 * A failed video render or attach still resolves with a photo-only entry;
 * `videoDone` stays false so a later call retries the attach.
 */
export async function ensureResultBackup(input: EnsureBackupInput): Promise<BackupEntry> {
  const task = lock.then(() => runBackup(input), () => runBackup(input));
  lock = task.catch(() => {});
  return task;
}

async function runBackup({ photo, brand, buildVideo, wantsVideo }: EnsureBackupInput): Promise<BackupEntry> {
  const hash = await hashBlob(photo);

  if (!current) {
    // First result of the session — create the folder.
    const link = await createShareLink({ photo, video: null, brand });
    current = { link, photoHash: hash, videoDone: !wantsVideo };
  } else if (current.photoHash !== hash) {
    // The user adjusted the result and came back — replace it in place. The
    // server drops the now-stale MP4; we re-attach the fresh one below.
    await replaceShareResult(current.link.id, { photo, brand });
    current.photoHash = hash;
    current.videoDone = !wantsVideo;
  }

  if (wantsVideo && !current.videoDone) {
    try {
      const video = await buildVideo();
      if (video) {
        await attachShareVideo(current.link.id, video);
        current.videoDone = true;
      }
    } catch {
      // Photo backup is already safe; leave videoDone false so the next
      // ensure call (auto or user-triggered) retries the attach.
    }
  }

  return { link: current.link, videoDone: current.videoDone };
}
