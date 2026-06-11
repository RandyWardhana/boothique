import { useEffect, useLayoutEffect, useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useDismissBoot } from '@/hooks/useDismissBoot';

const API_BASE = import.meta.env.VITE_SHARE_API_BASE?.replace(/\/$/, '') ?? '';

interface ShareMeta {
  id: string;
  brand: string;
  createdAt: number;
  expiresAt: number;
  hasVideo: boolean;
}

type ShareState =
  | { status: 'loading' }
  | { status: 'ready'; meta: ShareMeta }
  | { status: 'expired' }
  | { status: 'not-found' }
  | { status: 'error' };

function expiresLabel(expiresAt: number): string {
  const ms = Math.max(0, expiresAt - Date.now());
  const h = Math.round(ms / 3_600_000);
  if (h >= 1) return `Expires in ${h} hour${h === 1 ? '' : 's'}`;
  const m = Math.max(1, Math.round(ms / 60_000));
  return `Expires in ${m} minute${m === 1 ? '' : 's'}`;
}

async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, '_blank');
  }
}

export function SharePage({ id }: { id: string }) {
  const [state, setState] = useState<ShareState>({ status: 'loading' });
  useDismissBoot();

  // Apply default blossom theme so Tailwind tokens resolve on this standalone page.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const vars: Record<string, string> = {
      '--bg': '#fdf4ee',
      '--surface': '#fffaf6',
      '--text': '#5b4a78',
      '--sub': '#a692bd',
      '--border': '#f3dbe4',
      '--accent': '#ef9fbd',
      '--accent2': '#b79fe0',
      '--on-accent': '#5a3550',
      '--frame': '#f6d6df',
      '--radius': '18px',
      '--font-display': "'Gaegu', cursive",
      '--font-body': "'Gaegu', cursive",
      '--btn-shadow': 'none',
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    document.body.style.background = '#fdf4ee';
  }, []);

  useEffect(() => {
    if (!API_BASE) { setState({ status: 'error' }); return; }
    fetch(`${API_BASE}/api/meta/${id}`)
      .then(async (res) => {
        if (res.status === 410 || res.status === 404) {
          setState({ status: res.status === 410 ? 'expired' : 'not-found' });
          return;
        }
        if (!res.ok) { setState({ status: 'error' }); return; }
        const meta = (await res.json()) as ShareMeta;
        setState({ status: 'ready', meta });
      })
      .catch(() => setState({ status: 'error' }));
  }, [id]);

  const photoUrl = `${API_BASE}/s/${id}/photo.png`;
  const videoUrl = `${API_BASE}/s/${id}/video.mp4`;

  return (
    <div className="min-h-screen bg-base text-ink font-sans flex flex-col items-center gap-6 px-5 pt-10 pb-16">
      {/* Brand header */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-heading text-5xl text-ink leading-none">Boothique</span>
        <svg viewBox="0 0 200 16" width="200" height="16" aria-hidden="true">
          <path d="M4 12 Q100 2 196 11" stroke="var(--accent)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Loading */}
      {state.status === 'loading' && (
        <p className="text-sub text-sm mt-8 animate-pulse">Loading…</p>
      )}

      {/* Not found */}
      {state.status === 'not-found' && (
        <StatusCard pill="Not found" message="This share link doesn't exist." />
      )}

      {/* Expired */}
      {state.status === 'expired' && (
        <StatusCard pill="Expired" message="This strip was shared more than 72 hours ago — it's no longer available." />
      )}

      {/* Error */}
      {state.status === 'error' && (
        <StatusCard pill="Error" message="Something went wrong loading this strip." />
      )}

      {/* Ready */}
      {state.status === 'ready' && (
        <>
          <p className="text-sub text-sm m-0 text-center">
            {state.meta.brand} shared their booth strip with you 💕
          </p>

          <div className="w-full max-w-sm bg-surface border border-line rounded-[calc(var(--radius)*1.5)] p-5 flex flex-col gap-4 items-center shadow-[0_12px_40px_rgba(120,80,110,.14)]">
            <span className="bg-frame text-ink rounded-full px-4 py-1.5 text-[13px] font-bold">
              {expiresLabel(state.meta.expiresAt)}
            </span>

            <img
              src={photoUrl}
              alt={`${state.meta.brand} photo strip`}
              className="w-full rounded-app shadow-[0_8px_32px_rgba(0,0,0,.18)] block"
            />

            <button
              onClick={() => void downloadFile(photoUrl, `${state.meta.brand}-strip.png`)}
              className="w-full inline-flex items-center justify-center gap-2 font-sans font-bold text-[15px] bg-accent text-on-accent rounded-app px-5 py-3 cursor-pointer border-0"
            >
              ↓ Download photo (PNG)
            </button>

            {state.meta.hasVideo && (
              <>
                <video
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="w-full rounded-app shadow-[0_8px_32px_rgba(0,0,0,.18)] block bg-black"
                />
                <button
                  onClick={() => void downloadFile(videoUrl, `${state.meta.brand}-strip.mp4`)}
                  className="w-full inline-flex items-center justify-center gap-2 font-sans font-bold text-[15px] bg-accent2 text-on-accent rounded-app px-5 py-3 cursor-pointer border-0"
                >
                  ↓ Download video (MP4)
                </button>
              </>
            )}
          </div>
        </>
      )}

      <p className="text-xs text-sub text-center max-w-xs leading-relaxed m-0 opacity-70">
        This link is available for 72 hours, then it disappears.{' '}
        Made with Boothique — a photo booth in your browser.
      </p>

      <SpeedInsights />
    </div>
  );
}

function StatusCard({ pill, message }: { pill: string; message: string }) {
  return (
    <div className="w-full max-w-sm bg-surface border border-line rounded-[calc(var(--radius)*1.5)] p-8 flex flex-col items-center gap-3 shadow-lg">
      <span className="bg-frame text-ink rounded-full px-4 py-1.5 text-[13px] font-bold">{pill}</span>
      <p className="text-sub text-sm text-center m-0 leading-relaxed">{message}</p>
    </div>
  );
}
