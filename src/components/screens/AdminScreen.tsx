import { useEffect, useRef, useState } from 'react';
import type { LayoutId } from '@/types';
import { LAYOUTS, LAYOUT_ORDER } from '@/lib/frames/layouts';
import { useDismissBoot } from '@/hooks/useDismissBoot';
import { useTheme } from '@/hooks/useTheme';
import { useThemeVars } from '@/hooks/useThemeVars';
import { Card, Button } from '@/components/ui';
import { cn } from '@/utils/cn';

const LAYOUT_META: Record<LayoutId, { name: string; shots: string }> = {
  strip:    { name: 'Strip',    shots: '4 shots · vertical' },
  grid:     { name: 'Grid',     shots: '4 shots · 2 × 2' },
  polaroid: { name: 'Polaroid', shots: '1 shot · square' },
  wide:     { name: 'Wide',     shots: '4 shots · horizontal' },
  collage:  { name: 'Collage',  shots: '5 shots · scattered' },
};

function LayoutDiagram({ layoutId }: { layoutId: LayoutId }) {
  const layout = LAYOUTS[layoutId];
  const MAX_H = 88;
  const MAX_W = 120;
  const scale = Math.min(MAX_H / layout.h, MAX_W / layout.w);
  const w = Math.round(layout.w * scale);
  const h = Math.round(layout.h * scale);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${layout.w} ${layout.h}`} style={{ display: 'block' }}>
      <rect width={layout.w} height={layout.h} rx="18" fill="var(--frame)" />
      {layout.slots.map((slot, i) => (
        <rect
          key={i}
          x={slot.x} y={slot.y} width={slot.w} height={slot.h}
          rx="10" fill="var(--accent)" opacity="0.8"
          transform={slot.rotate ? `rotate(${slot.rotate} ${slot.x + slot.w / 2} ${slot.y + slot.h / 2})` : undefined}
        />
      ))}
    </svg>
  );
}

/**
 * Detect and erase photo-of-people regions using YCbCr skin-tone thresholding.
 * Returns a cleaned PNG blob and the number of slots erased (0 = image was
 * already a transparent frame, nothing to clear).
 */
async function autoCleanTemplate(
  file: File,
  cropHalf: boolean,
): Promise<{ blob: Blob; slotsFound: number }> {
  const src = await createImageBitmap(file);
  const srcW = cropHalf ? Math.floor(src.width / 2) : src.width;
  const srcH = src.height;

  const canvas = document.createElement('canvas');
  canvas.width = srcW;
  canvas.height = srcH;
  const ctx = canvas.getContext('2d')!;
  // drawImage with 9 args: crop left half when requested
  ctx.drawImage(src, 0, 0, srcW, srcH, 0, 0, srcW, srcH);
  src.close();

  const imageData = ctx.getImageData(0, 0, srcW, srcH);
  const { data } = imageData;
  const W = srcW, H = srcH;

  // --- Signal A: skin-tone mask (YCbCr) ---
  // Cb in [77,127] AND Cr in [133,173] AND Y in (60,220)
  // Y<220 excludes cream/white separators; Y>60 excludes deep shadows.
  const skin = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const Y  =  0.299 * r + 0.587 * g + 0.114 * b;
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      if (Cb >= 77 && Cb <= 127 && Cr >= 133 && Cr <= 173 && Y > 60 && Y < 220) {
        skin[y * W + x] = 1;
      }
    }
  }

  // --- Signal B: per-row color diversity (unique quantized colors / W) ---
  // Photos — even dark/covered subjects — have many distinct colors per row.
  // Frame separators and solid borders do not.
  const SKIN_RATIO = 0.03;
  const DIV_RATIO  = 0.35;
  const photoRow: boolean[] = [];
  for (let y = 0; y < H; y++) {
    let skinCount = 0;
    const colorSet = new Set<number>();
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (skin[p]) skinCount++;
      const i = p * 4;
      // 5-bit quantisation per channel
      colorSet.add((data[i] >> 3) * 1024 + (data[i + 1] >> 3) * 32 + (data[i + 2] >> 3));
    }
    photoRow[y] = (skinCount / W >= SKIN_RATIO) || (colorSet.size / W >= DIV_RATIO);
  }

  // --- group into contiguous y-bands ---
  const bands: { y1: number; y2: number }[] = [];
  let start: number | null = null;
  for (let y = 0; y <= H; y++) {
    const active = y < H ? photoRow[y] : false;
    if (active && start === null) { start = y; }
    else if (!active && start !== null) { bands.push({ y1: start, y2: y - 1 }); start = null; }
  }

  const minH = H * 0.07;
  const minW = W * 0.20;

  // --- x-extent: skin-only (diversity would fire on frame borders too) ---
  // Bands with no skin get x=null; we fill with the median x from other bands.
  type BandRaw = { x1: number | null; y1: number; x2: number | null; y2: number };
  const bandData: BandRaw[] = [];
  for (const { y1, y2 } of bands) {
    if (y2 - y1 < minH) continue;
    let minX = W, maxX = -1;
    for (let y = y1; y <= y2; y++) {
      const base = y * W;
      for (let x = 0; x < W; x++) {
        if (skin[base + x]) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
      }
    }
    bandData.push({ x1: maxX >= 0 ? minX : null, y1, x2: maxX >= 0 ? maxX : null, y2 });
  }

  // filter by height relative to median
  if (bandData.length > 0) {
    const hs = bandData.map(b => b.y2 - b.y1).sort((a, b) => a - b);
    const medH = hs[Math.floor(hs.length / 2)];
    bandData.splice(0, bandData.length, ...bandData.filter(b => b.y2 - b.y1 >= medH * 0.5));
  }

  // derive common x from skin-detected bands (robust against dark/covered slots)
  const validX1s = bandData.filter(b => b.x1 !== null).map(b => b.x1 as number).sort((a, b) => a - b);
  const validX2s = bandData.filter(b => b.x2 !== null).map(b => b.x2 as number).sort((a, b) => a - b);
  const commonX1 = validX1s.length > 0 ? validX1s[Math.floor(validX1s.length / 2)] : Math.floor(W / 8);
  const commonX2 = validX2s.length > 0 ? validX2s[Math.floor(validX2s.length / 2)] : W - Math.floor(W / 8);

  const finalSlots = commonX2 - commonX1 >= minW
    ? bandData.map(b => ({ x1: commonX1, y1: b.y1, x2: commonX2, y2: b.y2 }))
    : [];

  // --- zero out alpha in detected slot regions ---
  for (const { x1, y1, x2, y2 } of finalSlots) {
    for (let y = y1; y <= y2; y++) {
      const rowBase = y * W * 4;
      for (let x = x1; x <= x2; x++) {
        data[rowBase + x * 4 + 3] = 0;
      }
    }
  }

  if (finalSlots.length > 0) ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
  });

  return { blob, slotsFound: finalSlots.length };
}

type Status = { type: 'idle' } | { type: 'loading' } | { type: 'success'; msg: string } | { type: 'error'; msg: string };
interface SkinEntry { id: string; name: string; layoutId: string; overlayUrl: string; }

/** Obscure admin bulk-export path — must match EXPORT_PATH in worker/src/index.ts. */
const EXPORT_PATH = '/api/_sync/9c4f2a7e1b6d';

export function AdminScreen() {
  const { vars } = useTheme('light');
  useThemeVars(vars);
  useDismissBoot();

  const base = import.meta.env.VITE_SHARE_API_BASE as string | undefined;
  const [secret, setSecret] = useState(() => localStorage.getItem('boothique_admin_secret') ?? '');
  const [name, setName] = useState('');
  const [layoutId, setLayoutId] = useState<LayoutId>('strip');
  const [cropHalf, setCropHalf] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [cleanInfo, setCleanInfo] = useState<{ slotsFound: number } | null>(null);
  const [status, setStatus] = useState<Status>({ type: 'idle' });
  const [skins, setSkins] = useState<SkinEntry[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Stores the processed (transparent-holed) blob; null = use original file.
  const cleanedBlobRef = useRef<Blob | null>(null);
  const rawFileRef = useRef<File | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const fetchSkins = () => {
    if (!base) return;
    fetch(`${base}/api/skins`)
      .then(r => r.ok ? (r.json() as Promise<SkinEntry[]>) : Promise.resolve([]))
      .then(setSkins)
      .catch(() => {});
  };

  useEffect(fetchSkins, [base]);

  const runClean = async (file: File, crop: boolean) => {
    setCleaning(true);
    setCleanInfo(null);
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
    setPreview(null);
    try {
      const { blob, slotsFound } = await autoCleanTemplate(file, crop);
      cleanedBlobRef.current = slotsFound > 0 ? blob : null;
      setCleanInfo({ slotsFound });
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreview(url);
    } catch {
      cleanedBlobRef.current = null;
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setPreview(url);
    } finally {
      setCleaning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    rawFileRef.current = f;
    cleanedBlobRef.current = null;
    setCleanInfo(null);
    if (!f) {
      if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
      setPreview(null);
      return;
    }
    void runClean(f, cropHalf);
  };

  const handleCropHalfChange = (next: boolean) => {
    setCropHalf(next);
    if (rawFileRef.current) void runClean(rawFileRef.current, next);
  };

  const handleDelete = async (id: string) => {
    if (!base) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${base}/api/admin/skin/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      });
      if (res.ok) setSkins(prev => prev.filter(s => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportAll = () => {
    if (!base || !secret) return;
    localStorage.setItem('boothique_admin_secret', secret);
    // Plain browser navigation so the worker streams the ZIP straight to disk
    // (no in-memory buffering). The secret rides as ?k= since a download
    // navigation can't set headers; the worker 404s without the right value.
    const a = document.createElement('a');
    a.href = `${base}${EXPORT_PATH}?k=${encodeURIComponent(secret)}`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = rawFileRef.current;
    if (!file || !name.trim() || !base) return;
    localStorage.setItem('boothique_admin_secret', secret);
    setStatus({ type: 'loading' });

    const uploadBlob = cleanedBlobRef.current ?? file;
    const form = new FormData();
    form.append('image', uploadBlob, 'frame.png');
    form.append('name', name.trim());
    form.append('layoutId', layoutId);

    try {
      const res = await fetch(`${base}/api/admin/skin`, {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: 'error', msg: (data as { error?: string }).error ?? 'Upload failed' });
      } else {
        const d = data as { id?: string };
        setStatus({ type: 'success', msg: `Uploaded! Reload the booth to see it under "Custom". (ID: ${d.id ?? '?'})` });
        setName('');
        rawFileRef.current = null;
        cleanedBlobRef.current = null;
        if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
        setPreview(null);
        setCleanInfo(null);
        fetchSkins();
      }
    } catch (err) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Network error' });
    }
  };

  const hasFile = rawFileRef.current !== null;

  return (
    <div className="min-h-[100dvh] bg-base text-ink font-sans flex flex-col items-center px-4 py-10 gap-8">
      <div className="flex flex-col items-center gap-1">
        <span className="font-heading text-4xl text-ink leading-none">Boothique</span>
        <span className="font-sans text-sm text-sub">Frame Admin</span>
      </div>

      {!base && (
        <div className="w-full max-w-lg bg-surface border border-line rounded-app px-4 py-3 text-sm text-sub">
          VITE_SHARE_API_BASE is not set — add it to Vercel environment variables.
        </div>
      )}

      <Card className="w-full max-w-lg flex flex-col gap-5">
        <h2 className="font-heading text-2xl text-ink m-0">Upload a Frame</h2>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-5">

          {/* Admin secret */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[13px] font-bold text-sub uppercase tracking-wide">Admin Secret</label>
            <input
              type="password" value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Enter admin password"
              required autoComplete="current-password"
            />
          </div>

          {/* Skin name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[13px] font-bold text-sub uppercase tracking-wide">Frame Name</label>
            <input
              type="text" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Cherry Blossom"
              maxLength={60} required
            />
          </div>

          {/* Layout picker */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[13px] font-bold text-sub uppercase tracking-wide">Layout</label>
            <div className="flex gap-3 flex-wrap">
              {LAYOUT_ORDER.map((id) => {
                const active = layoutId === id;
                return (
                  <button
                    key={id} type="button" onClick={() => setLayoutId(id)}
                    className={cn(
                      'flex flex-col gap-2 items-center cursor-pointer p-2.5 bg-base rounded-[calc(var(--radius)*1.2)] border-2 transition-colors',
                      active ? 'border-accent' : 'border-line',
                    )}
                  >
                    <div className="flex items-center justify-center" style={{ minWidth: 52, minHeight: 56 }}>
                      <LayoutDiagram layoutId={id} />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={cn('font-sans text-[12.5px] font-bold', active ? 'text-ink' : 'text-sub')}>
                        {LAYOUT_META[id].name}
                      </span>
                      <span className="font-sans text-[11px] text-sub">{LAYOUT_META[id].shots}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image upload */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[13px] font-bold text-sub uppercase tracking-wide">Frame Image (PNG)</label>
            <input
              type="file" accept="image/png"
              onChange={handleFileChange}
              required style={{ padding: '8px 14px' }}
            />

            {/* Twin-strip option */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cropHalf}
                onChange={e => handleCropHalfChange(e.target.checked)}
              />
              <span className="font-sans text-[13px] text-sub">
                Twin-strip template (two identical halves side-by-side — crop to left half)
              </span>
            </label>

            <p className="font-sans text-[12.5px] text-sub m-0 leading-relaxed">
              Upload any template PNG — even with people in the slots. The photo areas will be
              auto-detected and erased to transparent. Or upload an already-transparent frame directly.
            </p>
          </div>

          {/* Cleaning status + preview */}
          {cleaning && (
            <div className="font-sans text-[13px] text-sub">Detecting and erasing photo slots…</div>
          )}

          {!cleaning && cleanInfo && (
            <div className={cn(
              'font-sans text-[13px] rounded-app px-3 py-2',
              cleanInfo.slotsFound > 0
                ? 'bg-frame text-ink'
                : 'bg-surface text-sub border border-line',
            )}>
              {cleanInfo.slotsFound > 0
                ? `Auto-removed ${cleanInfo.slotsFound} photo slot${cleanInfo.slotsFound > 1 ? 's' : ''}. Preview shows the cleaned frame.`
                : 'No photo content detected — looks like a clean transparent frame already.'}
            </div>
          )}

          {preview && !cleaning && (
            <div className="flex flex-col gap-1.5">
              <span className="font-sans text-[13px] font-bold text-sub uppercase tracking-wide">Preview</span>
              <img
                src={preview}
                alt="Frame preview"
                className="max-w-[200px] rounded-app border border-line"
                style={{ background: 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 14px 14px' }}
              />
            </div>
          )}

          <Button disabled={status.type === 'loading' || cleaning || !hasFile || !base} full>
            {status.type === 'loading' ? 'Uploading…' : 'Upload Frame'}
          </Button>

          {status.type === 'success' && (
            <p className="font-sans text-[13.5px] font-bold text-ink m-0 bg-frame rounded-app px-4 py-3">
              {status.msg}
            </p>
          )}
          {status.type === 'error' && (
            <p className="font-sans text-[13.5px] font-bold m-0 rounded-app px-4 py-3" style={{ color: '#c0392b', background: '#fde8e8' }}>
              {status.msg}
            </p>
          )}
        </form>
      </Card>

      <Card className="w-full max-w-lg flex flex-col gap-4">
        <h2 className="font-heading text-2xl text-ink m-0">Backup</h2>
        <p className="font-sans text-[13px] text-sub m-0 leading-relaxed">
          Download every share in R2 as a single ZIP — including ones past their 72h
          expiry. Enter the admin secret above to enable.
        </p>
        <Button variant="outline" full onClick={handleExportAll} disabled={!base || !secret}>
          Export all shares (.zip)
        </Button>
      </Card>

      {skins.length > 0 && (
        <Card className="w-full max-w-lg flex flex-col gap-4">
          <h2 className="font-heading text-2xl text-ink m-0">Manage Frames</h2>
          <div className="flex flex-col gap-2">
            {skins.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-base rounded-app px-3 py-2 border border-line">
                <img
                  src={s.overlayUrl} alt={s.name}
                  className="w-10 h-10 rounded object-contain border border-line"
                  style={{ background: 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 10px 10px' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-[13px] font-bold text-ink truncate">{s.name}</div>
                  <div className="font-sans text-[11px] text-sub">{s.layoutId} · {s.id}</div>
                </div>
                <button
                  onClick={() => { void handleDelete(s.id); }}
                  disabled={deletingId === s.id}
                  className="font-sans text-[12px] font-bold cursor-pointer px-2.5 py-1 rounded border border-line text-sub hover:text-ink disabled:opacity-40"
                >
                  {deletingId === s.id ? '…' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
