import { useState } from 'react';
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
          x={slot.x}
          y={slot.y}
          width={slot.w}
          height={slot.h}
          rx="10"
          fill="var(--accent)"
          opacity="0.8"
          transform={
            slot.rotate
              ? `rotate(${slot.rotate} ${slot.x + slot.w / 2} ${slot.y + slot.h / 2})`
              : undefined
          }
        />
      ))}
    </svg>
  );
}

type Status = { type: 'idle' } | { type: 'loading' } | { type: 'success'; msg: string } | { type: 'error'; msg: string };

export function AdminScreen() {
  const { vars } = useTheme('light');
  useThemeVars(vars);
  useDismissBoot();

  const base = import.meta.env.VITE_SHARE_API_BASE as string | undefined;
  const [secret, setSecret] = useState(() => localStorage.getItem('boothique_admin_secret') ?? '');
  const [name, setName] = useState('');
  const [layoutId, setLayoutId] = useState<LayoutId>('strip');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ type: 'idle' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim() || !base) return;
    localStorage.setItem('boothique_admin_secret', secret);
    setStatus({ type: 'loading' });

    const form = new FormData();
    form.append('image', file);
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
        setStatus({ type: 'success', msg: `Frame uploaded! ID: ${d.id ?? '?'}. Reload the booth to see it under "Custom".` });
        setName('');
        setFile(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
      }
    } catch (err) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Network error' });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-base text-ink font-sans flex flex-col items-center px-4 py-10 gap-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-heading text-4xl text-ink leading-none">Boothique</span>
        <span className="font-sans text-sm text-sub">Frame Admin</span>
      </div>

      {!base && (
        <div className="w-full max-w-lg bg-surface border border-line rounded-app px-4 py-3 text-sm text-sub">
          ⚠ <span className="font-bold text-ink">VITE_SHARE_API_BASE</span> is not set — add it to Vercel environment variables.
        </div>
      )}

      <Card className="w-full max-w-lg flex flex-col gap-5">
        <h2 className="font-heading text-2xl text-ink m-0">Upload a Frame</h2>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-5">

          {/* Admin secret */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[13px] font-bold text-sub uppercase tracking-wide">
              Admin Secret
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter admin password"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Skin name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[13px] font-bold text-sub uppercase tracking-wide">
              Frame Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cherry Blossom"
              maxLength={60}
              required
            />
          </div>

          {/* Layout picker */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[13px] font-bold text-sub uppercase tracking-wide">
              Layout
            </label>
            <p className="font-sans text-[13px] text-sub m-0 leading-relaxed">
              Choose the layout your frame PNG is designed for. The slot positions below show exactly where photos will appear — your transparent PNG holes must align with them.
            </p>
            <div className="flex gap-3 flex-wrap mt-1">
              {LAYOUT_ORDER.map((id) => {
                const active = layoutId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setLayoutId(id)}
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
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[13px] font-bold text-sub uppercase tracking-wide">
              Frame Image (PNG)
            </label>
            <input
              type="file"
              accept="image/png"
              onChange={handleFileChange}
              required
              style={{ padding: '8px 14px' }}
            />
            <p className="font-sans text-[12.5px] text-sub m-0 leading-relaxed">
              Upload a PNG with transparent holes where photos show through. Max 5 MB.
            </p>
          </div>

          {/* Image preview */}
          {preview && (
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

          <Button
            disabled={status.type === 'loading' || !base}
            full
          >
            {status.type === 'loading' ? 'Uploading…' : 'Upload Frame'}
          </Button>

          {status.type === 'success' && (
            <p className="font-sans text-[13.5px] font-bold text-ink m-0 bg-frame rounded-app px-4 py-3">
              ✓ {status.msg}
            </p>
          )}
          {status.type === 'error' && (
            <p className="font-sans text-[13.5px] font-bold m-0 rounded-app px-4 py-3" style={{ color: '#c0392b', background: '#fde8e8' }}>
              ✗ {status.msg}
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
