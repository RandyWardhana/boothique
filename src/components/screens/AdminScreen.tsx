import { useState } from 'react';

const LAYOUTS = [
  { id: 'strip', label: 'Strip — 4 shots, vertical' },
  { id: 'grid', label: 'Grid — 6 shots' },
  { id: 'polaroid', label: 'Polaroid — 4 shots' },
  { id: 'wide', label: 'Wide — 3 shots, landscape' },
  { id: 'collage', label: 'Collage — 6 shots, scattered' },
];

type Status = { type: 'idle' } | { type: 'loading' } | { type: 'success'; msg: string } | { type: 'error'; msg: string };

const css = {
  page: {
    minHeight: '100vh',
    background: '#fdf6f0',
    padding: '32px 24px',
    fontFamily: 'system-ui, sans-serif',
    color: '#1a1a1a',
  } satisfies React.CSSProperties,
  card: {
    maxWidth: 520,
    background: '#fff',
    borderRadius: 12,
    padding: 28,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  } satisfies React.CSSProperties,
  label: { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#555' } satisfies React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #ddd',
    borderRadius: 8,
    fontSize: 15,
    boxSizing: 'border-box' as const,
    background: '#fafafa',
  } satisfies React.CSSProperties,
  btn: {
    padding: '12px 24px',
    background: '#c96a7e',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  } satisfies React.CSSProperties,
};

export function AdminScreen() {
  const base = import.meta.env.VITE_SHARE_API_BASE as string | undefined;
  const [secret, setSecret] = useState(() => localStorage.getItem('boothique_admin_secret') ?? '');
  const [name, setName] = useState('');
  const [layoutId, setLayoutId] = useState('strip');
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
        setStatus({ type: 'success', msg: `Uploaded! Skin ID: ${d.id ?? '?'}. Reload the booth to see it.` });
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
    <div style={css.page}>
      <h1 style={{ fontFamily: 'Georgia, serif', marginTop: 0, marginBottom: 24, fontSize: 28 }}>Boothique · Frame Admin</h1>

      {!base && (
        <p style={{ color: '#c0392b', fontWeight: 600 }}>
          ⚠ VITE_SHARE_API_BASE is not configured — set it in Vercel environment variables.
        </p>
      )}

      <form onSubmit={void handleSubmit} style={css.card}>
        <div>
          <label style={css.label}>Admin Secret</label>
          <input
            style={css.input}
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter admin secret"
            required
            autoComplete="current-password"
          />
        </div>

        <div>
          <label style={css.label}>Skin Name</label>
          <input
            style={css.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cherry Blossom"
            maxLength={60}
            required
          />
        </div>

        <div>
          <label style={css.label}>Layout</label>
          <select
            style={{ ...css.input, paddingRight: 32 }}
            value={layoutId}
            onChange={(e) => setLayoutId(e.target.value)}
          >
            {LAYOUTS.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={css.label}>Frame Image (PNG with transparency)</label>
          <input
            style={{ ...css.input, padding: '8px 14px' }}
            type="file"
            accept="image/png"
            onChange={handleFileChange}
            required
          />
          <p style={{ fontSize: 12, color: '#888', marginTop: 6, marginBottom: 0 }}>
            Design a PNG where the frame border is opaque and the photo areas are transparent. Max 5 MB.
          </p>
        </div>

        {preview && (
          <div>
            <label style={css.label}>Preview</label>
            <img
              src={preview}
              alt="Frame preview"
              style={{ maxWidth: 220, display: 'block', border: '1px solid #ddd', borderRadius: 8, background: 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 16px 16px' }}
            />
          </div>
        )}

        <button
          type="submit"
          style={{ ...css.btn, opacity: status.type === 'loading' || !base ? 0.6 : 1, cursor: status.type === 'loading' || !base ? 'not-allowed' : 'pointer' }}
          disabled={status.type === 'loading' || !base}
        >
          {status.type === 'loading' ? 'Uploading…' : 'Upload Frame'}
        </button>

        {status.type === 'success' && (
          <p style={{ color: '#27ae60', fontWeight: 600, margin: 0 }}>✓ {status.msg}</p>
        )}
        {status.type === 'error' && (
          <p style={{ color: '#c0392b', fontWeight: 600, margin: 0 }}>✗ {status.msg}</p>
        )}
      </form>
    </div>
  );
}
