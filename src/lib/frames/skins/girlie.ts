import type { Prim, Skin } from '@/types';
import { scatter } from '../layouts';
import { borderRect, captionText, compact, subText } from './helpers';
import type { Layout } from '@/types';

/**
 * The "girlie" pack — coquette, cherry, gingham, pearls and friends. These lean
 * on a handful of primitive-only pattern generators (no images) so they render
 * identically on the canvas export and the DOM preview.
 */

function scallops(L: Layout, color: string): Prim[] {
  const out: Prim[] = [];
  const step = 52;
  for (let x = 0; x <= L.w; x += step) {
    out.push({ type: 'circle', cx: x, cy: 0, r: 30, fill: color });
    out.push({ type: 'circle', cx: x, cy: L.h, r: 30, fill: color });
  }
  return out;
}

function gingham(L: Layout, color: string): Prim[] {
  const out: Prim[] = [];
  const s = 56;
  for (let x = 0; x < L.w; x += s * 2) out.push({ type: 'rect', x, y: 0, w: s, h: L.h, fill: color, alpha: 0.3 });
  for (let y = 0; y < L.h; y += s * 2) out.push({ type: 'rect', x: 0, y, w: L.w, h: s, fill: color, alpha: 0.3 });
  return out;
}

function checker(L: Layout, c1: string, c2: string): Prim[] {
  const out: Prim[] = [];
  const s = 110;
  for (let r = 0; r * s < L.h; r++) {
    for (let c = 0; c * s < L.w; c++) {
      out.push({ type: 'rect', x: c * s, y: r * s, w: s, h: s, fill: (r + c) % 2 ? c1 : c2 });
    }
  }
  return out;
}

function clouds(L: Layout): Prim[] {
  const out: Prim[] = [];
  scatter(L, 6, 41).forEach((p) => {
    const r = 46 + p.r * 40;
    [
      [-r * 0.8, 0.7],
      [0, 1],
      [r * 0.8, 0.75],
    ].forEach(([dx, scale]) => {
      out.push({ type: 'circle', cx: p.x + dx, cy: p.y, r: r * scale, fill: '#ffffff', alpha: 0.85 });
    });
  });
  return out;
}

function cherries(L: Layout): Prim[] {
  const out: Prim[] = [];
  scatter(L, 7, 53).forEach((p) => {
    const s = 0.8 + p.r * 0.5;
    const { x, y } = p;
    out.push({ type: 'rect', x: x - 3, y: y - 34 * s, w: 5, h: 30 * s, fill: '#5c9460', rotate: -16, alpha: 0.9 });
    out.push({ type: 'rect', x: x + 10, y: y - 34 * s, w: 5, h: 30 * s, fill: '#5c9460', rotate: 14, alpha: 0.9 });
    out.push({ type: 'circle', cx: x - 6 * s, cy: y, r: 13 * s, fill: '#d6336c' });
    out.push({ type: 'circle', cx: x + 16 * s, cy: y + 4 * s, r: 13 * s, fill: '#e8517f' });
  });
  return out;
}

function pearls(L: Layout, inset: number): Prim[] {
  const out: Prim[] = [];
  const step = 52;
  const pearl = (cx: number, cy: number) => {
    out.push({ type: 'circle', cx, cy, r: 11, fill: '#e7d9c3' });
    out.push({ type: 'circle', cx: cx - 3, cy: cy - 3, r: 6, fill: '#fbf6ee' });
  };
  for (let x = inset; x <= L.w - inset; x += step) {
    pearl(x, inset);
    pearl(x, L.h - inset);
  }
  for (let y = inset + step; y <= L.h - inset - step; y += step) {
    pearl(inset, y);
    pearl(L.w - inset, y);
  }
  return out;
}

function sparkles(L: Layout, colors: string[], seed = 67): Prim[] {
  return scatter(L, 16, seed).map((p, i): Prim => ({
    type: 'text',
    x: p.x,
    y: p.y,
    text: i % 3 ? '✦' : '✧',
    size: 22 + p.r * 30,
    color: colors[i % colors.length],
    alpha: 0.8,
    font: 'body',
    align: 'center',
  }));
}

export const GIRLIE_SKINS: Skin[] = [
  {
    id: 'seo-coquette',
    dir: 'seoul',
    name: 'Coquette',
    bg: '#fff6f0',
    photo: { radius: 18, mat: '#ffffff' },
    decor: (L, info) => ({
      under: scallops(L, '#f6b6c9').concat(
        scatter(L, 10, 19).map((p): Prim => ({
          type: 'text',
          x: p.x,
          y: p.y,
          text: '♡',
          size: 22 + p.r * 20,
          color: '#e8a2b8',
          alpha: 0.6,
          font: 'body',
          align: 'center',
        })),
      ),
      over: compact([borderRect(L, 44, '#f3d7e0', 2), captionText(L, info.brand, '#d34f7e'), subText(L, info.sub, '#c2789a')]),
    }),
  },
  {
    id: 'seo-cherry',
    dir: 'seoul',
    name: 'Cherry Pop',
    bg: { grad: ['#fff0f3', '#ffd8e2'] },
    photo: { radius: 18, mat: '#ffffff' },
    decor: (L, info) => ({
      under: cherries(L),
      over: compact([captionText(L, info.brand, '#c2255c'), subText(L, info.sub, '#d66a92')]),
    }),
  },
  {
    id: 'seo-gingham',
    dir: 'seoul',
    name: 'Gingham Picnic',
    bg: '#fff5f7',
    photo: { radius: 14, mat: '#ffffff' },
    decor: (L, info) => ({
      under: gingham(L, '#f7a8c0'),
      over: compact([captionText(L, info.brand, '#d6336c'), subText(L, info.sub, '#c2789a')]),
    }),
  },
  {
    id: 'seo-checker',
    dir: 'seoul',
    name: 'Checker Pastel',
    bg: '#fdf1f4',
    photo: { radius: 18, mat: '#ffffff' },
    decor: (L, info) => ({
      under: checker(L, '#f9cfe0', '#eadcf6'),
      over: compact([captionText(L, info.brand, '#a05fae'), subText(L, info.sub, '#b88aa6')]),
    }),
  },
  {
    id: 'seo-cloud',
    dir: 'seoul',
    name: 'Daydream',
    bg: { grad: ['#dcecfb', '#f6e9fb'] },
    photo: { radius: 22, mat: '#ffffff' },
    decor: (L, info) => ({
      under: clouds(L).concat(sparkles(L, ['#a48ad4', '#7fa9cc'], 29)),
      over: compact([captionText(L, info.brand, '#6f86c9'), subText(L, info.sub, '#93a3d1')]),
    }),
  },
  {
    id: 'seo-pearl',
    dir: 'seoul',
    name: 'Pearl',
    bg: '#fffdfa',
    photo: { radius: 16, mat: '#ffffff', stroke: '#eee3d2' },
    decor: (L, info) => ({
      under: [],
      over: compact([borderRect(L, 24, '#f0e6d6', 2)])
        .concat(pearls(L, 24))
        .concat(compact([captionText(L, info.brand, '#b08d57'), subText(L, info.sub, '#c4ab86')])),
    }),
  },
  {
    id: 'y2k-doll',
    dir: 'y2k',
    name: 'Glitter Doll',
    bg: { grad: ['#ffd6f2', '#e3d2ff'] },
    photo: { radius: 12, mat: '#ffffff' },
    decor: (L, info) => ({
      under: sparkles(L, ['#ffffff', '#ff5ec4', '#b18cff'], 71),
      over: compact([
        borderRect(L, 14, '#ff5ec4', 5),
        captionText(L, info.brand, '#b8369a', 'display', { glow: '#ffb3e3' }),
        subText(L, info.date, '#8d63c9'),
      ]),
    }),
  },
  {
    id: 'ins-ballet',
    dir: 'instant',
    name: 'Ballet',
    bg: '#fbf2f4',
    photo: { radius: 6, mat: '#ffffff', stroke: '#eed7dd' },
    decor: (L, info) => ({
      under: [],
      over: compact([
        borderRect(L, 16, '#e3b3c0', 2.5),
        borderRect(L, 26, '#e3b3c0', 1),
        captionText(L, info.brand, '#c0758c'),
        subText(L, info.sub, '#cf9aa9'),
      ]),
    }),
  },
];
