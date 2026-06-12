import { renderExpiredPage, renderNotFoundPage, renderResultPage, type ShareMeta } from './pages';
import { handleExportShares } from './archive';

export interface Env {
  SHARES: R2Bucket;
  /** Public origin this Worker is served from, no trailing slash. */
  PUBLIC_BASE_URL: string;
  /** Origin allowed to POST uploads, or "*". */
  ALLOWED_ORIGIN: string;
  /** Secret required for admin skin upload. Set via `wrangler secret put ADMIN_SECRET`. */
  ADMIN_SECRET?: string;
}

interface SkinConfig {
  id: string;
  name: string;
  layoutId: string;
  overlayUrl: string;
  createdAt: number;
}

/** USER read access ends exactly 72h after upload — every share route returns
 *  410 past this. The R2 objects are NOT deleted here; they're retained so the
 *  admin bulk-export (archive.ts) can back them up. See wrangler.toml retention. */
const TTL_MS = 72 * 60 * 60 * 1000;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
const MAX_SKIN_BYTES = 5 * 1024 * 1024;
const ID_PATTERN = /^[a-z0-9]{12}$/;
const VALID_LAYOUTS = ['strip', 'grid', 'polaroid', 'wide', 'collage'] as const;

/** Obscure, unguessable path for the admin bulk-export of all shares. Not a
 *  security boundary on its own — the ADMIN_SECRET is. See archive.ts. */
const EXPORT_PATH = '/api/_sync/9c4f2a7e1b6d';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    if (request.method === 'POST' && pathname === '/api/share') {
      return handleUpload(request, env);
    }

    if (request.method === 'POST' && pathname === '/api/admin/skin') {
      return handleAdminSkinUpload(request, env);
    }

    if (request.method === 'DELETE') {
      const deleteSkinMatch = pathname.match(/^\/api\/admin\/skin\/([^/]+)$/);
      if (deleteSkinMatch) return handleAdminSkinDelete(deleteSkinMatch[1], request, env);
    }

    if (request.method === 'GET') {
      if (pathname === EXPORT_PATH) return handleExportShares(request, env);

      const metaMatch = pathname.match(/^\/api\/meta\/([^/]+)$/);
      if (metaMatch) return handleMeta(metaMatch[1], env);

      const pageMatch = pathname.match(/^\/s\/([^/]+)\/?$/);
      if (pageMatch) return handlePage(pageMatch[1], env, request);

      const assetMatch = pathname.match(/^\/s\/([^/]+)\/(photo\.png|video\.mp4)$/);
      if (assetMatch) return handleAsset(assetMatch[1], assetMatch[2], env);

      if (pathname === '/api/skins') return handleGetSkins(env);

      const skinOverlayMatch = pathname.match(/^\/api\/skins\/([^/]+)\/overlay\.png$/);
      if (skinOverlayMatch) return handleSkinOverlay(skinOverlayMatch[1], env);

      if (pathname === '/' || pathname === '/health') {
        return new Response('Boothique share service', { status: 200, headers: { 'content-type': 'text/plain' } });
      }
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

/* ------------------------------ share upload ------------------------------ */

async function handleUpload(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'expected multipart/form-data' }, 400, env);
  }

  const photo = asFile(form.get('photo'));
  if (!photo) return json({ error: 'photo is required' }, 400, env);
  if (photo.size === 0 || photo.size > MAX_PHOTO_BYTES) return json({ error: 'photo too large' }, 413, env);

  const video = asFile(form.get('video'));
  const hasVideo = video !== null && video.size > 0;
  if (video && video.size > MAX_VIDEO_BYTES) return json({ error: 'video too large' }, 413, env);

  const brand = String(form.get('brand') ?? 'Boothique').slice(0, 60);
  const id = generateId();
  const now = Date.now();
  const expiresAt = now + TTL_MS;
  const customMetadata = { expiresAt: String(expiresAt) };

  await env.SHARES.put(`shares/${id}/photo.png`, photo.stream(), {
    httpMetadata: { contentType: 'image/png' },
    customMetadata,
  });

  if (hasVideo && video) {
    await env.SHARES.put(`shares/${id}/video.mp4`, video.stream(), {
      httpMetadata: { contentType: 'video/mp4' },
      customMetadata,
    });
  }

  const meta: ShareMeta = { brand, createdAt: now, expiresAt, hasVideo };
  await env.SHARES.put(`shares/${id}/meta.json`, JSON.stringify(meta), {
    httpMetadata: { contentType: 'application/json' },
    customMetadata,
  });

  return json({ id, url: `${base(request)}/s/${id}`, expiresAt }, 200, env);
}

/* ------------------------------ admin skin upload ------------------------------ */

async function handleAdminSkinUpload(request: Request, env: Env): Promise<Response> {
  const secret = request.headers.get('x-admin-secret');
  if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) {
    return json({ error: 'unauthorized' }, 401, env);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'expected multipart/form-data' }, 400, env);
  }

  const image = asFile(form.get('image'));
  if (!image) return json({ error: 'image is required' }, 400, env);
  if (image.size === 0 || image.size > MAX_SKIN_BYTES) return json({ error: 'image too large (max 5 MB)' }, 413, env);
  if (!image.type.includes('png')) return json({ error: 'image must be a PNG' }, 400, env);

  const name = String(form.get('name') ?? '').slice(0, 60).trim();
  if (!name) return json({ error: 'name is required' }, 400, env);

  const layoutId = String(form.get('layoutId') ?? '');
  if (!(VALID_LAYOUTS as readonly string[]).includes(layoutId)) {
    return json({ error: `layoutId must be one of: ${VALID_LAYOUTS.join(', ')}` }, 400, env);
  }

  const id = generateId();
  const overlayUrl = `${base(request)}/api/skins/${id}/overlay.png`;

  await env.SHARES.put(`skins/${id}/overlay.png`, image.stream(), {
    httpMetadata: { contentType: 'image/png' },
  });

  const manifestObj = await env.SHARES.get('skins/manifest.json');
  const manifest: SkinConfig[] = manifestObj ? ((await manifestObj.json()) as SkinConfig[]) : [];
  manifest.push({ id, name, layoutId, overlayUrl, createdAt: Date.now() });
  await env.SHARES.put('skins/manifest.json', JSON.stringify(manifest), {
    httpMetadata: { contentType: 'application/json' },
  });

  return json({ id, name, layoutId, overlayUrl }, 200, env);
}

/* ------------------------------ admin skin delete ------------------------------ */

async function handleAdminSkinDelete(id: string, request: Request, env: Env): Promise<Response> {
  const secret = request.headers.get('x-admin-secret');
  if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) {
    return json({ error: 'unauthorized' }, 401, env);
  }

  if (!ID_PATTERN.test(id)) return json({ error: 'invalid id' }, 400, env);

  const manifestObj = await env.SHARES.get('skins/manifest.json');
  const manifest: SkinConfig[] = manifestObj ? ((await manifestObj.json()) as SkinConfig[]) : [];
  const filtered = manifest.filter((s) => s.id !== id);

  if (filtered.length === manifest.length) {
    return json({ error: 'skin not found' }, 404, env);
  }

  await Promise.all([
    env.SHARES.put('skins/manifest.json', JSON.stringify(filtered), {
      httpMetadata: { contentType: 'application/json' },
    }),
    env.SHARES.delete(`skins/${id}/overlay.png`),
  ]);

  return json({ ok: true }, 200, env);
}

/* ------------------------------ skins fetch ------------------------------ */

async function handleGetSkins(env: Env): Promise<Response> {
  const manifestObj = await env.SHARES.get('skins/manifest.json');
  if (!manifestObj) return json([], 200, env);
  const manifest = await manifestObj.json();
  return json(manifest, 200, env);
}

async function handleSkinOverlay(id: string, env: Env): Promise<Response> {
  if (!ID_PATTERN.test(id)) return new Response('Not found', { status: 404 });

  const object = await env.SHARES.get(`skins/${id}/overlay.png`);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=86400, immutable');
  headers.set('access-control-allow-origin', env.ALLOWED_ORIGIN || '*');
  return new Response(object.body, { status: 200, headers });
}

/* ------------------------------ pages ------------------------------ */

async function handlePage(id: string, env: Env, request: Request): Promise<Response> {
  if (!ID_PATTERN.test(id)) return html(renderNotFoundPage(), 404);

  const object = await env.SHARES.get(`shares/${id}/meta.json`);
  if (!object) return html(renderNotFoundPage(), 404);

  const meta = (await object.json()) as ShareMeta;
  const now = Date.now();
  if (now > meta.expiresAt) return html(renderExpiredPage(), 410);

  return html(renderResultPage(id, meta, base(request), now), 200, {
    'cache-control': 'public, max-age=300',
  });
}

/** JSON metadata for a share — used by the React share page on Vercel. */
async function handleMeta(id: string, env: Env): Promise<Response> {
  if (!ID_PATTERN.test(id)) return json({ error: 'not found' }, 404, env);

  const object = await env.SHARES.get(`shares/${id}/meta.json`);
  if (!object) return json({ error: 'not found' }, 404, env);

  const meta = (await object.json()) as ShareMeta;
  if (Date.now() > meta.expiresAt) return json({ error: 'expired', expiresAt: meta.expiresAt }, 410, env);

  return json({ ...meta, id }, 200, env);
}

async function handleAsset(id: string, file: string, env: Env): Promise<Response> {
  if (!ID_PATTERN.test(id)) return new Response('Not found', { status: 404 });

  const object = await env.SHARES.get(`shares/${id}/${file}`);
  if (!object) return new Response('Not found', { status: 404 });

  const expiresAt = Number(object.customMetadata?.expiresAt ?? 0);
  if (expiresAt && Date.now() > expiresAt) {
    return new Response('Gone', { status: 410 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=3600');
  // CORS needed so the Vercel share page can fetch() blobs for download.
  headers.set('access-control-allow-origin', env.ALLOWED_ORIGIN || '*');
  return new Response(object.body, { status: 200, headers });
}

/* ------------------------------ helpers ------------------------------ */

/** Narrow a form entry to an uploaded file (Workers types it as File | string). */
function asFile(entry: File | string | null): File | null {
  return entry !== null && typeof entry !== 'string' ? entry : null;
}

function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

/** Derive the public origin from the incoming request so it's always correct,
 *  regardless of what PUBLIC_BASE_URL is set to in wrangler.toml. */
function base(request: Request): string {
  const { protocol, host } = new URL(request.url);
  return `${protocol}//${host}`;
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    'access-control-allow-origin': env.ALLOWED_ORIGIN || '*',
    'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type, x-admin-secret',
    'access-control-max-age': '86400',
  };
}

function json(payload: unknown, status: number, env: Env): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(env) },
  });
}

function html(body: string, status: number, extra: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', ...extra },
  });
}
