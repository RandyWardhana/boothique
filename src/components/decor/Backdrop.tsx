import { Motif, type MotifShape } from './Motif';

/** Deterministic scattered glyphs: [shape, top%, left%, size, accentKey]. */
const SPOTS: Array<[MotifShape, number, number, number, 'a' | 'b']> = [
  ['heart', 5, 12, 26, 'a'],
  ['star', 12, 78, 22, 'b'],
  ['spark', 20, 30, 20, 'a'],
  ['plus', 8, 52, 16, 'a'],
  ['dot', 16, 90, 12, 'b'],
  ['heart', 30, 6, 20, 'b'],
  ['spark', 44, 94, 24, 'a'],
  ['star', 60, 4, 22, 'a'],
  ['plus', 72, 88, 18, 'b'],
  ['heart', 86, 14, 24, 'a'],
  ['dot', 90, 64, 12, 'a'],
  ['spark', 78, 40, 18, 'b'],
  ['star', 94, 32, 20, 'b'],
  ['heart', 52, 50, 18, 'b'],
  ['plus', 38, 70, 15, 'a'],
  ['dot', 26, 58, 11, 'a'],
  ['spark', 66, 70, 20, 'a'],
  ['heart', 14, 44, 18, 'a'],
  ['star', 46, 22, 18, 'b'],
  ['plus', 96, 80, 16, 'a'],
  ['dot', 70, 16, 12, 'b'],
  ['spark', 34, 86, 16, 'b'],
  ['lines', 58, 84, 22, 'a'],
  ['lines', 24, 18, 20, 'b'],
];

/** Fixed, faint motif field behind the whole app. */
export function Backdrop() {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {SPOTS.map(([shape, top, left, size, accent], i) => (
        <div key={i} style={{ position: 'absolute', top: `${top}%`, left: `${left}%`, transform: 'translate(-50%,-50%)' }}>
          <Motif
            shape={shape}
            size={size}
            color={accent === 'a' ? 'var(--accent)' : 'var(--accent2)'}
            opacity={0.22}
            rotate={((i * 37) % 60) - 30}
          />
        </div>
      ))}
    </div>
  );
}

/** Pink rounded ring framing the viewport, echoing the app icon. */
export function PinkFrame() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 7,
        zIndex: 45,
        pointerEvents: 'none',
        border: '7px solid var(--frame)',
        borderRadius: 30,
        boxShadow: 'inset 0 0 0 1.5px color-mix(in oklab, var(--frame) 60%, #fff)',
      }}
    />
  );
}
