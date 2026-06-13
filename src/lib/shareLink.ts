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

// Keyed by the photo's content hash so revisiting the result screen (which
// re-renders the canvas) reuses the upload instead of duplicating it. Session
// scope is intentional: a new result is a new backup.
const uploadedResults = new Map<string, BackupEntry>();
const inFlightBackups = new Map<string, Promise<BackupEntry>>();

async function hashBlob(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload a result to R2 exactly once, photo first so the backup lands even if
 * the (slow) video render never finishes, then attach the MP4. Returns the
 * share link for the upload — callers that only want the backup can ignore it.
 *
 * A failed video render or attach still resolves with a photo-only entry;
 * `videoDone` stays false so a later call retries the attach.
 */
export async function ensureResultBackup({ photo, brand, buildVideo, wantsVideo }: EnsureBackupInput): Promise<BackupEntry> {
  const key = await hashBlob(photo);

  const existing = uploadedResults.get(key);
  if (existing && (existing.videoDone || !wantsVideo)) return existing;

  const pending = inFlightBackups.get(key);
  if (pending) return pending;

  const task = (async () => {
    let entry = uploadedResults.get(key);
    if (!entry) {
      const link = await createShareLink({ photo, video: null, brand });
      entry = { link, videoDone: !wantsVideo };
      uploadedResults.set(key, entry);
    }
    if (wantsVideo && !entry.videoDone) {
      try {
        const video = await buildVideo();
        if (video) await attachShareVideo(entry.link.id, video);
        entry.videoDone = true;
      } catch {
        // Photo backup is already safe; leave videoDone false so the next
        // ensure call (auto or user-triggered) retries the attach.
      }
    }
    return entry;
  })().finally(() => inFlightBackups.delete(key));

  inFlightBackups.set(key, task);
  return task;
}
