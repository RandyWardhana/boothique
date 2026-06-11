/**
 * Direction themes — each frame collection ("direction") carries its own fonts,
 * corner radius and light/dark token sets. The UI commits to the `seoul`
 * direction, but every direction's tokens stay available because skins keep
 * their original direction for canvas font resolution.
 */

export interface DirectionTokens {
  bg: string;
  surface: string;
  text: string;
  sub: string;
  border: string;
  accent: string;
  accent2: string;
  onAccent: string;
}

export interface Direction {
  name: string;
  radius: number;
  fonts: { display: string; body: string };
  light: DirectionTokens;
  dark: DirectionTokens;
  buttonShadow: string;
}

export const DIRECTIONS: Record<string, Direction> = {
  y2k: {
    name: 'Y2K',
    radius: 6,
    fonts: { display: "'Silkscreen', monospace", body: "'Space Grotesk', sans-serif" },
    light: { bg: '#efeaf8', surface: '#ffffff', text: '#1d1433', sub: '#6e5f93', border: '#cfc2ea', accent: '#e62ea4', accent2: '#00b4c4', onAccent: '#ffffff' },
    dark: { bg: '#140e26', surface: '#221944', text: '#f1ecfb', sub: '#a497c7', border: '#3b2d68', accent: '#ff5ec4', accent2: '#2bd9e8', onAccent: '#1d1433' },
    buttonShadow: '4px 4px 0',
  },
  vintage: {
    name: 'Vintage Booth',
    radius: 8,
    fonts: { display: "'Yellowtail', cursive", body: "'Libre Caslon Text', serif" },
    light: { bg: '#f1e8d8', surface: '#faf4e8', text: '#33241a', sub: '#7d6a55', border: '#d9c9ad', accent: '#c4452c', accent2: '#9a7b3f', onAccent: '#faf4e8' },
    dark: { bg: '#1c1410', surface: '#2a1f18', text: '#f0e4ce', sub: '#a8916f', border: '#473527', accent: '#ff7a45', accent2: '#d8b15e', onAccent: '#1c1410' },
    buttonShadow: 'none',
  },
  instant: {
    name: 'Instant',
    radius: 12,
    fonts: { display: "'Caveat', cursive", body: "'Karla', sans-serif" },
    light: { bg: '#f4f2ee', surface: '#ffffff', text: '#26262b', sub: '#73737d', border: '#e0ddd6', accent: '#e9694f', accent2: '#5e8fb8', onAccent: '#ffffff' },
    dark: { bg: '#1d1d21', surface: '#2a2a30', text: '#f0efeb', sub: '#9b9ba5', border: '#3d3d45', accent: '#f08266', accent2: '#7fa9cc', onAccent: '#1d1d21' },
    buttonShadow: 'none',
  },
  seoul: {
    name: 'Seoul Cut',
    radius: 18,
    fonts: { display: "'Gaegu', cursive", body: "'Gaegu', cursive" },
    light: { bg: '#fbf3f5', surface: '#ffffff', text: '#4d3c45', sub: '#a18995', border: '#f3dde5', accent: '#f2a8c0', accent2: '#bcabe6', onAccent: '#54323f' },
    dark: { bg: '#272026', surface: '#352b33', text: '#f5ebef', sub: '#bda6b1', border: '#4a3a45', accent: '#e9a8bf', accent2: '#b7a6e0', onAccent: '#33202a' },
    buttonShadow: 'none',
  },
};

/** The direction the UI is themed with. */
export const ACTIVE_DIRECTION: string = 'seoul';
