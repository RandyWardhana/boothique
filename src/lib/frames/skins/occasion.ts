import type { Layout, Prim, Skin } from '@/types';
import { scatter } from '../layouts';
import { borderRect, captionText, compact, subText } from './helpers';

/**
 * The "occasion" pack — graduation, birthday and party skins, deliberately
 * chaotic. Each skin overrides the display/body fonts to match its mood.
 */

function confetti(L: Layout, colors: string[], n: number, seed: number): Prim[] {
  const out: Prim[] = [];
  scatter(L, n, seed).forEach((p, i) => {
    const c = colors[i % colors.length];
    if (i % 3 === 0) {
      out.push({ type: 'circle', cx: p.x, cy: p.y, r: 6 + p.r * 8, fill: c, alpha: 0.9 });
    } else {
      out.push({ type: 'rect', x: p.x, y: p.y, w: 10 + p.r * 16, h: 18 + p.r * 14, rotate: Math.round(p.r * 360), fill: c, alpha: 0.9 });
    }
  });
  return out;
}

function scatterWords(L: Layout, words: string[], colors: string[], seed: number, size: number): Prim[] {
  return scatter(L, words.length, seed).map((p, i): Prim => ({
    type: 'text',
    x: 60 + p.x * 0.85,
    y: 40 + p.y * 0.9,
    text: words[i],
    size: size * (0.8 + p.r * 0.5),
    color: colors[i % colors.length],
    rotate: Math.round(-24 + p.r * 48),
    font: 'display',
    align: 'center',
    alpha: 0.95,
  }));
}

function streamers(L: Layout, colors: string[], seed: number): Prim[] {
  const out: Prim[] = [];
  scatter(L, 9, seed).forEach((p, i) => {
    out.push({
      type: 'rect',
      x: p.x,
      y: -40,
      w: 14,
      h: 190 + p.r * 220,
      rotate: Math.round(-26 + p.r * 52),
      fill: colors[i % colors.length],
      alpha: 0.75,
    });
  });
  return out;
}

function balloons(L: Layout, colors: string[], seed: number): Prim[] {
  const out: Prim[] = [];
  scatter(L, 7, seed).forEach((p, i) => {
    const r = 30 + p.r * 26;
    const c = colors[i % colors.length];
    out.push({ type: 'rect', x: p.x - 1.5, y: p.y + r * 0.8, w: 3, h: r * 2.2, fill: c, alpha: 0.55 });
    out.push({ type: 'circle', cx: p.x, cy: p.y, r, fill: c, alpha: 0.92 });
    out.push({ type: 'circle', cx: p.x - r * 0.3, cy: p.y - r * 0.35, r: r * 0.26, fill: '#ffffff', alpha: 0.65 });
    out.push({ type: 'rect', x: p.x - 7, y: p.y + r * 0.86, w: 14, h: 12, rotate: 45, fill: c, alpha: 0.92 });
  });
  return out;
}

function gradCaps(L: Layout, navy: string, gold: string, seed: number): Prim[] {
  const out: Prim[] = [];
  scatter(L, 6, seed).forEach((p) => {
    const s = 0.75 + p.r * 0.6;
    const { x, y } = p;
    const rot = Math.round(-20 + p.r * 40);
    out.push({ type: 'rect', x: x - 22 * s, y, w: 44 * s, h: 26 * s, rotate: rot, fill: navy, alpha: 0.95 });
    out.push({ type: 'rect', x: x - 38 * s, y: y - 38 * s, w: 76 * s, h: 76 * s, rotate: 45 + rot, fill: navy });
    out.push({ type: 'circle', cx: x, cy: y - 4 * s, r: 5 * s, fill: gold });
    out.push({ type: 'rect', x, y: y - 2 * s, w: 3, h: 44 * s, rotate: 24 + rot, fill: gold });
    out.push({ type: 'circle', cx: x + 18 * s, cy: y + 38 * s, r: 7 * s, fill: gold });
  });
  return out;
}

function candles(L: Layout, colors: string[]): Prim[] {
  const out: Prim[] = [];
  const n = Math.max(4, Math.floor(L.w / 180));
  for (let i = 0; i < n; i++) {
    const x = (L.w / (n + 1)) * (i + 1);
    const c = colors[i % colors.length];
    out.push({ type: 'rect', x: x - 7, y: 18, w: 14, h: 52, r: 5, fill: c });
    out.push({ type: 'circle', cx: x, cy: 10, r: 9, fill: '#f6c95e', alpha: 0.95 });
    out.push({ type: 'circle', cx: x, cy: 10, r: 17, fill: '#f6c95e', alpha: 0.25 });
  }
  return out;
}

function tapeCorners(L: Layout, color: string): Prim[] {
  const out: Prim[] = [];
  L.slots.forEach((s, i) => {
    out.push({ type: 'rect', x: s.x - 34, y: s.y - 16, w: 92, h: 30, rotate: -38 + (i % 3) * 6, fill: color, alpha: 0.7 });
    out.push({ type: 'rect', x: s.x + s.w - 58, y: s.y + s.h - 16, w: 92, h: 30, rotate: 34 - (i % 3) * 6, fill: color, alpha: 0.7 });
  });
  return out;
}

export const OCCASION_SKINS: Skin[] = [
  {
    id: 'occ-grad',
    dir: 'occasion',
    name: 'Grad Day',
    fonts: { display: "'Fredoka', sans-serif", body: "'Quicksand', sans-serif" },
    bg: '#fbf5e8',
    photo: { radius: 10, mat: '#ffffff' },
    decor: (L, info) => ({
      under: gradCaps(L, '#46549a', '#dcb45e', 13)
        .concat(confetti(L, ['#dcb45e', '#46549a', '#b8c4ee'], 16, 37))
        .concat(
          scatterWords(
            L,
            [`CLASS OF ${new Date().getFullYear()}`, 'WE MADE IT!', 'CONGRATS!'],
            ['#46549a', '#dcb45e', '#8a96cf'],
            57,
            Math.max(30, L.w * 0.045),
          ),
        ),
      over: compact([
        borderRect(L, 16, '#46549a', 4),
        borderRect(L, 28, '#dcb45e', 2),
        captionText(L, info.brand, '#46549a'),
        subText(L, info.sub, '#9a8a5e'),
      ]),
    }),
  },
  {
    id: 'occ-bday',
    dir: 'occasion',
    name: 'B-Day Bash',
    fonts: { display: "'Cherry Bomb One', cursive", body: "'Nunito', sans-serif" },
    bg: { grad: ['#fdf3d8', '#fde3ea'] },
    photo: { radius: 16, mat: '#ffffff' },
    decor: (L, info) => ({
      under: balloons(L, ['#f2a8c0', '#a7c8ec', '#f6d98a', '#b8e3c2'], 17)
        .concat(confetti(L, ['#f2a8c0', '#a7c8ec', '#f6d98a', '#c9b6ec'], 22, 43))
        .concat(scatterWords(L, ['HBD!!', '♡', 'MAKE A WISH', 'YAY!'], ['#e07a9d', '#7d9fd1', '#d9a93f'], 61, Math.max(28, L.w * 0.05)))
        .concat(candles(L, ['#f2a8c0', '#a7c8ec', '#b8e3c2'])),
      over: compact([captionText(L, info.brand, '#e07a9d'), subText(L, info.sub, '#c98aa6')]),
    }),
  },
  {
    id: 'occ-party',
    dir: 'occasion',
    name: 'Party Pop',
    fonts: { display: "'Cherry Bomb One', cursive", body: "'Nunito', sans-serif" },
    bg: { grad: ['#e3f0fb', '#fbe7f1'] },
    photo: { radius: 14, mat: '#ffffff' },
    decor: (L, info) => ({
      under: streamers(L, ['#f2a8c0', '#a7c8ec', '#f6d98a', '#b8e3c2', '#c9b6ec'], 23)
        .concat(confetti(L, ['#f2a8c0', '#a7c8ec', '#f6d98a', '#c9b6ec', '#b8e3c2'], 26, 71))
        .concat(scatterWords(L, ['WOO!!', "LET'S GO", '★', 'PARTY'], ['#7d9fd1', '#e07a9d', '#d9a93f'], 83, Math.max(26, L.w * 0.045))),
      over: compact([
        borderRect(L, 18, '#a7c8ec', 3, { dash: [18, 14] }),
        captionText(L, info.brand, '#5f86c4'),
        subText(L, info.sub, '#93a8cc'),
      ]),
    }),
  },
  {
    id: 'occ-confetti',
    dir: 'occasion',
    name: 'Confetti Chaos',
    fonts: { display: "'Cherry Bomb One', cursive", body: "'Nunito', sans-serif" },
    bg: '#fffdf8',
    photo: { radius: 8 },
    decor: (L, info) => ({
      under: confetti(L, ['#f2a8c0', '#a7c8ec', '#f6d98a', '#b8e3c2', '#c9b6ec', '#f6b69a'], 44, 91),
      over: tapeCorners(L, '#f6d98a').concat(compact([captionText(L, info.brand, '#e07a9d'), subText(L, info.sub, '#b9a48a')])),
    }),
  },
  {
    id: 'occ-disco',
    dir: 'occasion',
    name: 'Disco Nite',
    fonts: { display: "'Silkscreen', monospace", body: "'Quicksand', sans-serif" },
    bg: '#2e2438',
    photo: { radius: 12, mat: '#3d3050' },
    decor: (L, info) => {
      const dots: Prim[] = [];
      const palette = ['#f4b8cd', '#b59ce0', '#9fd8d4', '#f6d98a'];
      scatter(L, 22, 101).forEach((p, i) => {
        dots.push({ type: 'circle', cx: p.x, cy: p.y, r: 5 + p.r * 12, fill: palette[i % palette.length], alpha: 0.75 });
      });
      return {
        under: dots.concat(
          scatter(L, 12, 113).map((p, i): Prim => ({
            type: 'text',
            x: p.x,
            y: p.y,
            text: i % 2 ? '✦' : '♪',
            size: 24 + p.r * 30,
            color: i % 2 ? '#f4b8cd' : '#9fd8d4',
            alpha: 0.8,
            font: 'body',
            align: 'center',
          })),
        ),
        over: compact([
          borderRect(L, 16, '#b59ce0', 3, { glow: '#b59ce0' }),
          captionText(L, info.brand, '#f4b8cd', 'display', { glow: '#f4b8cd' }),
          subText(L, info.sub, '#9c8bb5'),
        ]),
      };
    },
  },
];
