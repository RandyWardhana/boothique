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
