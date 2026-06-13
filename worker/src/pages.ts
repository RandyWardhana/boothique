/** Branded HTML responses for the share Worker. */

export interface ShareMeta {
  brand: string;
  createdAt: number;
  /** Same instant as `createdAt`, ISO 8601 — human-readable when browsing R2.
   *  Optional so shares written before this field still parse. */
  createdAtISO?: string;
  expiresAt: number;
  hasVideo: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Human-readable "expires in …" string from now until `expiresAt`. */
function expiresInLabel(expiresAt: number, now: number): string {
  const ms = Math.max(0, expiresAt - now);
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) {
    const h = Math.round(ms / 3_600_000);
    return `Expires in ${h} hour${h === 1 ? '' : 's'}`;
  }
  const minutes = Math.max(1, Math.round(ms / 60_000));
  return `Expires in ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

const FONT_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap" rel="stylesheet">';

const SHELL_CSS = `
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{background:#fdf4ee;color:#5b4a78;font-family:'Gaegu',cursive;
    min-height:100vh;display:flex;flex-direction:column;align-items:center;
    padding:32px 20px 48px;gap:24px;text-align:center}
  .brand{font-family:'Gaegu',cursive;font-size:40px;line-height:1;color:#5b4a78}
  .swoosh{display:block;margin:4px auto 0}
  .muted{color:#a692bd;font-size:14px;margin:0}
  .card{background:#fffaf6;border:1.5px solid #f3dbe4;border-radius:24px;
    padding:18px;max-width:520px;width:100%;display:flex;flex-direction:column;
    gap:16px;align-items:center;box-shadow:0 12px 40px rgba(120,80,110,.12)}
  .media{width:100%;display:block;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.18)}
  video.media{background:#000}
  .btn{appearance:none;border:none;cursor:pointer;font-family:'Gaegu',cursive;
    font-weight:700;font-size:15px;border-radius:14px;padding:12px 20px;width:100%;
    text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;
    background:#ef9fbd;color:#5a3550;transition:filter .12s ease,transform .12s ease}
  .btn.alt{background:#b79fe0}
  .btn:hover{filter:brightness(1.05);transform:translateY(-1px)}
  .footer{font-size:13px;color:#a692bd;max-width:460px;line-height:1.5}
  .pill{display:inline-block;background:#f6d6df;color:#5a3550;border-radius:999px;
    padding:5px 14px;font-size:13px;font-weight:700}
`;

const SWOOSH = (width: number) =>
  `<svg class="swoosh" viewBox="0 0 ${width} 16" width="${width}" height="16"><path d="M4 12 Q${width / 2} 2 ${width - 4} 11" stroke="#ef9fbd" stroke-width="3.4" stroke-linecap="round" fill="none"/></svg>`;

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#fdf4ee">
<title>${escapeHtml(title)}</title>${FONT_LINK}<style>${SHELL_CSS}</style></head>
<body>${body}</body></html>`;
}

/** The branded result page showing the framed photo (and video, if present). */
export function renderResultPage(id: string, meta: ShareMeta, base: string, now: number): string {
  const brand = escapeHtml(meta.brand || 'Boothique');
  const photoUrl = `${base}/s/${id}/photo.png`;
  const videoUrl = `${base}/s/${id}/video.mp4`;
  const expiry = expiresInLabel(meta.expiresAt, now);

  const video = meta.hasVideo
    ? `<video class="media" src="${videoUrl}" autoplay loop muted playsinline controls></video>
       <a class="btn alt" href="${videoUrl}" download="${brand}-strip.mp4">↓ Download video (MP4)</a>`
    : '';

  const body = `
    <div>
      <div class="brand">${brand}</div>
      ${SWOOSH(Math.min(280, Math.max(120, brand.length * 22)))}
      <p class="muted">Someone shared their booth strip with you 💕</p>
    </div>
    <div class="card">
      <span class="pill">${expiry}</span>
      <img class="media" src="${photoUrl}" alt="${brand} photo strip">
      <a class="btn" href="${photoUrl}" download="${brand}-strip.png">↓ Download photo (PNG)</a>
      ${video}
    </div>
    <p class="footer">This link is available for 72 hours, then it disappears. Made with Boothique — a photo booth in your browser.</p>`;

  return shell(`${meta.brand || 'Boothique'} — booth strip`, body);
}

/** Page shown when a share id is unknown. */
export function renderNotFoundPage(): string {
  const body = `
    <div><div class="brand">Boothique</div>${SWOOSH(160)}</div>
    <div class="card"><span class="pill">Not found</span>
      <p class="muted">This share link doesn't exist.</p></div>
    <p class="footer">Made with Boothique — a photo booth in your browser.</p>`;
  return shell('Not found — Boothique', body);
}

/** Page shown when a share has passed its 72-hour window. */
export function renderExpiredPage(): string {
  const body = `
    <div><div class="brand">Boothique</div>${SWOOSH(160)}</div>
    <div class="card"><span class="pill">Expired</span>
      <p class="muted">This booth strip was shared more than 72 hours ago, so it's no longer available.</p></div>
    <p class="footer">Made with Boothique — a photo booth in your browser.</p>`;
  return shell('Expired — Boothique', body);
}
