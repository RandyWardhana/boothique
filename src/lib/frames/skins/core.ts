import type { Prim, Skin } from '@/types';
import { scatter } from '../layouts';
import { borderRect, captionText, compact, stampSize, subText } from './helpers';

/**
 * The four base collections — Y2K, Vintage, Instant and Seoul. Each skin paints
 * a background, decides how photos are matted, and emits `under`/`over`
 * decoration prims (drawn below and above the photos respectively).
 */
export const CORE_SKINS: Skin[] = [
  /* ---------- Y2K ---------- */
  {
    id: 'y2k-pink',
    dir: 'y2k',
    name: 'Hot Pink',
    bg: { grad: ['#ff3eb5', '#ff8ad1'] },
    photo: { radius: 10, mat: '#ffffff' },
    decor: (L, info) => ({
      under: scatter(L, 14, 3).map((p): Prim => ({
        type: 'rect',
        x: p.x,
        y: p.y,
        w: 26 + p.r * 22,
        h: 26 + p.r * 22,
        rotate: 45,
        fill: '#ffe14d',
        alpha: 0.85,
      })),
      over: compact([
        borderRect(L, 14, '#ffe14d', 6),
        captionText(L, info.brand, '#ffffff'),
        subText(L, info.date, '#ffe14d', { font: 'stamp', size: stampSize(L) }),
      ]),
    }),
  },
  {
    id: 'y2k-chrome',
    dir: 'y2k',
    name: 'Chrome',
    bg: { grad: ['#eef1f8', '#c3cad9'] },
    photo: { radius: 10, mat: '#ffffff' },
    decor: (L, info) => {
      const under: Prim[] = [];
      for (let y = 0; y < L.h; y += 56) {
        under.push({ type: 'rect', x: 0, y, w: L.w, h: 8, fill: '#aab3c6', alpha: 0.35 });
      }
      return {
        under,
        over: compact([
          borderRect(L, 12, '#00b4c4', 6),
          captionText(L, info.brand, '#1d1433'),
          subText(L, info.date, '#586079', { font: 'stamp', size: stampSize(L) }),
        ]),
      };
    },
  },
  {
    id: 'y2k-cyber',
    dir: 'y2k',
    name: 'Cyber',
    bg: '#0b0b13',
    photo: { radius: 6, mat: '#101622', stroke: '#3dff8a' },
    decor: (L, info) => {
      const under: Prim[] = [];
      for (let y = 0; y < L.h; y += 14) {
        under.push({ type: 'rect', x: 0, y, w: L.w, h: 3, fill: '#3dff8a', alpha: 0.05 });
      }
      return {
        under,
        over: compact([
          borderRect(L, 12, '#3dff8a', 4),
          captionText(L, info.brand, '#3dff8a', 'display', { glow: '#3dff8a' }),
          subText(L, info.date, '#9fffce', { font: 'stamp', size: stampSize(L) }),
        ]),
      };
    },
  },
  /* ---------- Vintage ---------- */
  {
    id: 'vin-classic',
    dir: 'vintage',
    name: 'Booth Classic',
    bg: '#17120d',
    photo: { radius: 3, mat: '#f0e4ce' },
    decor: (L, info) => {
      const under: Prim[] = [];
      if (L.id === 'strip' || L.id === 'wide') {
        const vertical = L.id === 'strip';
        const span = vertical ? L.h : L.w;
        for (let p = 26; p < span - 20; p += 64) {
          if (vertical) {
            under.push({ type: 'rect', x: 10, y: p, w: 22, h: 30, r: 6, fill: '#f0e4ce', alpha: 0.16 });
            under.push({ type: 'rect', x: L.w - 32, y: p, w: 22, h: 30, r: 6, fill: '#f0e4ce', alpha: 0.16 });
          } else {
            under.push({ type: 'rect', x: p, y: 8, w: 30, h: 22, r: 6, fill: '#f0e4ce', alpha: 0.16 });
            under.push({ type: 'rect', x: p, y: L.h - 30, w: 30, h: 22, r: 6, fill: '#f0e4ce', alpha: 0.16 });
          }
        }
      }
      return {
        under,
        over: compact([
          captionText(L, info.brand, '#f0e4ce'),
          subText(L, info.sub, '#a8916f'),
        ]),
      };
    },
  },
  {
    id: 'vin-cream',
    dir: 'vintage',
    name: 'Cream Card',
    bg: '#f3ead7',
    photo: { radius: 3, mat: '#ffffff' },
    decor: (L, info) => ({
      under: [],
      over: compact([
        borderRect(L, 14, '#6b5234', 3),
        borderRect(L, 24, '#6b5234', 1.5),
        captionText(L, info.brand, '#6b5234'),
        subText(L, info.sub, '#8d7048'),
      ]),
    }),
  },
  {
    id: 'vin-neon',
    dir: 'vintage',
    name: 'Neon Sign',
    bg: '#221710',
    photo: { radius: 6, mat: '#17100b' },
    decor: (L, info) => {
      const under: Prim[] = [];
      const step = Math.max(56, Math.floor(L.w / 14));
      for (let x = step; x < L.w - 30; x += step) {
        under.push({ type: 'circle', cx: x, cy: 8, r: 4, fill: '#d8b15e', alpha: 0.7 });
        under.push({ type: 'circle', cx: x, cy: L.h - 8, r: 4, fill: '#d8b15e', alpha: 0.7 });
      }
      return {
        under,
        over: compact([
          borderRect(L, 16, '#ff7a45', 3, { glow: '#ff7a45' }),
          captionText(L, info.brand, '#ff7a45', 'display', { glow: '#ff7a45' }),
          subText(L, info.sub, '#d8b15e'),
        ]),
      };
    },
  },
  /* ---------- Instant ---------- */
  {
    id: 'ins-white',
    dir: 'instant',
    name: 'Gallery White',
    bg: '#ffffff',
    photo: { radius: 4, stroke: '#e0ddd6' },
    decor: (L, info) => ({
      under: [],
      over: compact([
        captionText(L, info.brand, '#26262b'),
        subText(L, info.sub, '#9b9ba5'),
      ]),
    }),
  },
  {
    id: 'ins-sun',
    dir: 'instant',
    name: 'Sunset Bar',
    bg: '#fffdf8',
    photo: { radius: 4, stroke: '#efe9dd' },
    decor: (L, info) => {
      const barHeight = L.id === 'wide' ? 0 : Math.max(140, L.h - (L.sub ? L.sub.cy : L.caption.cy) + 110);
      const under: Prim[] = barHeight
        ? [{ type: 'rect', x: 0, y: L.h - barHeight, w: L.w, h: barHeight, fill: '#e9694f' }]
        : [];
      const capColor = barHeight ? '#fffdf8' : '#e9694f';
      return {
        under,
        over: compact([
          captionText(L, info.brand, capColor),
          subText(L, info.sub, barHeight ? '#ffd9cf' : '#9b9ba5'),
        ]),
      };
    },
  },
  {
    id: 'ins-sky',
    dir: 'instant',
    name: 'Sky',
    bg: '#eaf1f7',
    photo: { radius: 4, mat: '#ffffff' },
    decor: (L, info) => ({
      under: [],
      over: compact([
        borderRect(L, 16, '#5e8fb8', 3, { dash: [14, 12] }),
        captionText(L, info.brand, '#5e8fb8'),
        subText(L, info.sub, '#86a8c4'),
      ]),
    }),
  },
  /* ---------- Seoul ---------- */
  {
    id: 'seo-blush',
    dir: 'seoul',
    name: 'Blush',
    bg: { grad: ['#ffe6ee', '#ffd2e1'] },
    photo: { radius: 18, mat: '#ffffff' },
    decor: (L, info) => ({
      under: scatter(L, 16, 11).map((p): Prim => ({
        type: 'text',
        x: p.x,
        y: p.y,
        text: '♥',
        size: 26 + p.r * 26,
        color: '#ef7ba2',
        alpha: 0.5,
        font: 'body',
        align: 'center',
      })),
      over: compact([
        captionText(L, info.brand, '#d34f7e'),
        subText(L, info.sub, '#c2789a'),
      ]),
    }),
  },
  {
    id: 'seo-lav',
    dir: 'seoul',
    name: 'Lavender Film',
    bg: '#e9e1f6',
    photo: { radius: 18, mat: '#ffffff' },
    decor: (L, info) => ({
      under: scatter(L, 18, 23).map((p): Prim => ({
        type: 'circle',
        cx: p.x,
        cy: p.y,
        r: 8 + p.r * 14,
        fill: '#b59ce0',
        alpha: 0.3,
      })),
      over: compact([
        captionText(L, info.brand, '#7a5fae'),
        subText(L, info.sub, '#9a86c4'),
      ]),
    }),
  },
  {
    id: 'seo-night',
    dir: 'seoul',
    name: 'Night Cream',
    bg: '#2c2231',
    photo: { radius: 18, mat: '#fbeef3' },
    decor: (L, info) => ({
      under: scatter(L, 14, 31).map((p): Prim => ({
        type: 'text',
        x: p.x,
        y: p.y,
        text: '✦',
        size: 20 + p.r * 22,
        color: '#f4b8cd',
        alpha: 0.6,
        font: 'body',
        align: 'center',
      })),
      over: compact([
        captionText(L, info.brand, '#f4b8cd'),
        subText(L, info.sub, '#bb9cab'),
      ]),
    }),
  },
];
