/** Hand-drawn hero illustrations matching the Boothique icon. */

interface SwooshProps {
  width?: number;
  color?: string;
}

/** Pink underline swoosh drawn beneath the wordmark. */
export function Swoosh({ width = 220, color = 'var(--accent)' }: SwooshProps) {
  const h = Math.max(12, width * 0.07);
  return (
    <svg viewBox={`0 0 ${width} ${h}`} width={width} height={h} style={{ display: 'block' }}>
      <path
        d={`M4 ${h - 4} Q${width / 2} 2 ${width - 4} ${h - 5}`}
        stroke={color}
        strokeWidth={Math.max(3, width * 0.018)}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

interface SizedProps {
  size?: number;
  color?: string;
}

/** Line-art camera with a heart lens — the icon's hero motif. */
export function CameraDoodle({ size = 68, color = 'var(--accent)' }: SizedProps) {
  return (
    <svg viewBox="0 0 140 110" width={size} height={(size * 110) / 140} fill="none">
      <g stroke={color} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="14" y="34" width="112" height="66" rx="15" />
        <path d="M44 34l8-13h26l8 13" />
        <circle cx="70" cy="68" r="20" />
        <rect x="104" y="42" width="14" height="9" rx="3" />
      </g>
      <path d="M70 60c-6-7-17-2-17 6 0 7 10 12 17 18 7-6 17-11 17-18 0-8-11-13-17-6z" fill={color} opacity="0.85" />
      <g stroke={color} strokeWidth="3.4" strokeLinecap="round" opacity="0.8">
        <path d="M126 18l8-6M120 10l3-9" />
        <path d="M16 20l-9-5M22 11l-2-9" />
      </g>
    </svg>
  );
}

/** Compact booth illustration for the hero. */
export function BoothMark({ width = 150 }: { width?: number }) {
  const k = width / 150;
  return (
    <svg viewBox="0 0 150 180" width={width} height={180 * k} fill="none">
      <rect x="6" y="10" width="138" height="30" rx="12" fill="var(--accent2)" />
      <rect x="6" y="10" width="138" height="30" rx="12" fill="none" stroke="#fff" strokeWidth="2.5" />
      <path d="M120 18c-3.4-4-10-1.2-10 3.5 0 4.4 6 7.4 10 11 4-3.6 10-6.6 10-11 0-4.7-6.6-7.5-10-3.5z" fill="#fff" />
      <rect x="14" y="40" width="122" height="132" fill="#8f74c4" />
      <path d="M44 54h62l8 118H36z" fill="#b89fe2" />
      <path d="M44 54h62l8 118H36z" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="M75 80c-9-11-26-4-26 9 0 12 17 20 26 29 9-9 26-17 26-29 0-13-17-20-26-9z" fill="none" stroke="var(--accent)" strokeWidth="5" />
      <path d="M14 40q22 10 19 70-1.5 36-19 40-5-58 0-110z" fill="var(--accent)" />
      <path d="M136 40q-22 10-19 70 1.5 36 19 40 5-58 0-110z" fill="var(--accent)" />
      <g fill="#fff" opacity="0.9">
        <path d="M52 120l2-6 2 6 6 2-6 2-2 6-2-6-6-2z" />
        <path d="M96 116l1.8-5 1.8 5 5 1.8-5 1.8-1.8 5-1.8-5-5-1.8z" />
      </g>
    </svg>
  );
}

interface HeartStickerProps {
  width?: number;
  lines?: string[];
}

/** Heart sticker accent with a short caption. */
export function HeartSticker({ width = 120, lines = ['예쁘게', '찍자 ♥'] }: HeartStickerProps) {
  const k = width / 120;
  return (
    <div style={{ position: 'relative', width, height: 116 * k, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}>
      <svg viewBox="0 0 120 116" width={width} height={116 * k} style={{ position: 'absolute', inset: 0 }}>
        <path d="M60 26c-21-25-58-7-58 21 0 27 35 44 58 67 23-23 58-40 58-67 0-28-37-46-58-21z" fill="#fff" />
        <path d="M60 33c-17-20-48-5.5-48 17 0 22 29 36 48 56 19-20 48-34 48-56 0-22.5-31-37-48-17z" fill="var(--accent)" />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          top: '20%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          fontFamily: 'var(--font-display)',
          color: '#fff',
          fontSize: 16 * k,
          lineHeight: 1.05,
          fontWeight: 700,
          textShadow: '0 1px 2px rgba(0,0,0,0.12)',
          whiteSpace: 'nowrap',
        }}
      >
        {lines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </div>
    </div>
  );
}
