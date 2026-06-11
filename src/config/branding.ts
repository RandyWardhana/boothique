import type { DirectionTokens } from './directions';

/**
 * Branding tokens that used to live in the prototyping "tweaks" panel. They are
 * design-time knobs: the brand name, the UI font pairing, the pastel palette
 * that overrides the Seoul base tokens, and a global UI scale.
 */

/** Extra palette tokens layered on top of the active direction's tokens. */
export type PaletteTokens = DirectionTokens & { frame: string };

export interface FontPair {
  display: string;
  body: string;
}

/** Curated display + body font pairings for the Seoul UI. */
export const FONT_PAIRS: Record<string, FontPair> = {
  gaegu:  { display: "'Gaegu', cursive",        body: "'Gaegu', cursive" },
  cherry: { display: "'Cherry Bomb One', cursive", body: "'Gaegu', cursive" },
  melody: { display: "'Hi Melody', cursive",    body: "'Gaegu', cursive" },
  fredoka: { display: "'Fredoka', sans-serif",  body: "'Gaegu', cursive" },
};

export interface Palette {
  light: PaletteTokens;
  dark: PaletteTokens;
}

/** Pastel palettes — each overrides the Seoul Cut base tokens. */
export const PALETTES: Record<string, Palette> = {
  blossom: {
    light: { bg: '#fdf4ee', surface: '#fffaf6', border: '#f3dbe4', accent: '#ef9fbd', accent2: '#b79fe0', onAccent: '#5a3550', text: '#5b4a78', sub: '#a692bd', frame: '#f6d6df' },
    dark:  { bg: '#272029', surface: '#352b38', border: '#4a3a4c', accent: '#ec9fbc', accent2: '#bba6e6', onAccent: '#2a2033', text: '#f3ecf6', sub: '#bda6c4', frame: '#5e4a5c' },
  },
  mint: {
    light: { bg: '#eef7f1', surface: '#fbfdfb', border: '#d8ebdf', accent: '#8fd0a8', accent2: '#a3bfe6', onAccent: '#234734', text: '#42594b', sub: '#88a293', frame: '#cde9d6' },
    dark:  { bg: '#1f2622', surface: '#2b352f', border: '#3d4c43', accent: '#97d0ac', accent2: '#9fc0e6', onAccent: '#1e3328', text: '#e9f2ec', sub: '#a4b8ab', frame: '#3a5446' },
  },
  lilac: {
    light: { bg: '#f4f1fb', surface: '#fdfcff', border: '#e4dcf3', accent: '#b79fe0', accent2: '#efa3c0', onAccent: '#392b52', text: '#4b3e60', sub: '#9488ab', frame: '#e1d4f3' },
    dark:  { bg: '#241f2d', surface: '#322b3e', border: '#473d57', accent: '#b9a3e3', accent2: '#e7a9c1', onAccent: '#2a2138', text: '#efeaf7', sub: '#aa9fba', frame: '#4a3d5e' },
  },
  peach: {
    light: { bg: '#fdf3ec', surface: '#fffaf6', border: '#f4e1d4', accent: '#f2ad92', accent2: '#97c8c6', onAccent: '#5a3526', text: '#574438', sub: '#a8917f', frame: '#f7ddcd' },
    dark:  { bg: '#291f1a', surface: '#372b24', border: '#4e3c32', accent: '#eeb094', accent2: '#96c4c3', onAccent: '#38241a', text: '#f6ece5', sub: '#bda396', frame: '#5a4233' },
  },
};

/** Default branding for the app. */
export const BRANDING = {
  brandName: 'Boothique',
  fontPair: 'gaegu',
  palette: 'blossom',
  /** Global UI zoom in percent. */
  uiScale: 100,
} as const;
