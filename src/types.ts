/**
 * Shared domain types for the photo booth.
 *
 * The vocabulary mirrors a physical booth: a *shot* is a single frame the camera
 * captured, a *layout* is the geometry of the printed card, a *skin* paints that
 * card, and *prims* are the low-level shapes a skin draws (rectangles, circles,
 * text) onto both the canvas export and the live DOM preview.
 */

export type Lang = 'en' | 'id';
export type ThemePref = 'light' | 'dark' | 'system';

/** A single captured frame, optionally paired with a short looping video clip. */
export interface Shot {
  id: string;
  /** JPEG data URL of the still. */
  img: string;
  /** Object URL of the recorded clip, or `null` while it is still encoding. */
  clipUrl: string | null;
  /** Whether the source was mirrored when captured (selfie view). */
  mirror: boolean;
  /** Lazily-filled cache of beautified stills, keyed by rounded strength. */
  beautyCache?: Record<number, string>;
}

/** Photo adjustment settings applied across the whole strip. */
export interface Filter {
  preset: string;
  brightness: number;
  contrast: number;
  saturation: number;
  /** Skin-smoothing strength, 0–100. */
  beautify: number;
}

export interface FilterPreset {
  id: string;
  tKey: string;
  css: string;
}

/** Where a single photo sits inside a layout, in frame pixels. */
export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  /** Polaroid-style paper mat drawn behind the photo. */
  mat?: { pad: number; padBottom: number };
}

export interface TextAnchor {
  cx: number;
  cy: number;
  size: number;
  rotate?: number;
}

/** Geometry of a printed card: canvas size plus where each photo and caption go. */
export interface Layout {
  id: LayoutId;
  tKey: string;
  w: number;
  h: number;
  count: number;
  slots: Slot[];
  header?: TextAnchor;
  caption: TextAnchor;
  sub: TextAnchor | null;
}

export type LayoutId = 'strip' | 'grid' | 'polaroid' | 'wide' | 'collage';

export type FontRole = 'display' | 'body' | 'stamp';

/** Drawing primitives shared by the canvas renderer and the DOM preview. */
export interface RectPrim {
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  rotate?: number;
  fill?: string;
  stroke?: string;
  strokeW?: number;
  dash?: number[];
  alpha?: number;
  glow?: string;
  size?: number;
}

export interface CirclePrim {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
  fill: string;
  alpha?: number;
  glow?: string;
  size?: number;
}

export interface TextPrim {
  type: 'text';
  x: number;
  y: number;
  text: string;
  size: number;
  color: string;
  font?: FontRole;
  align?: CanvasTextAlign;
  rotate?: number;
  alpha?: number;
  weight?: number;
  glow?: string;
}

export type Prim = RectPrim | CirclePrim | TextPrim;

/** Caption/date values a skin interpolates into its decorations. */
export interface FrameInfo {
  brand: string;
  date: string;
  longDate: string;
}

export interface Decor {
  under: Prim[];
  over: Prim[];
}

export interface SkinPhoto {
  radius?: number;
  mat?: string;
  stroke?: string;
}

export type SkinBg = string | { grad: [string, string] };

/** A paint job for a card: background, photo treatment, and decorations. */
export interface Skin {
  id: string;
  /** Collection this skin belongs to — drives default fonts and grouping. */
  dir: string;
  name: string;
  bg: SkinBg;
  photo?: SkinPhoto;
  /** Per-skin font override (used by the occasion packs). */
  fonts?: { display: string; body: string };
  /** URL of a transparent PNG drawn over photos — used by custom uploaded frames. */
  overlay?: string;
  /** Layout this skin is designed for — custom uploaded frames only. */
  layoutId?: string;
  /** Slot positions auto-detected from the overlay PNG's transparent regions. */
  customSlots?: Slot[];
  decor: (layout: Layout, info: FrameInfo) => Decor;
}

/** A placed, draggable sticker on the final frame. */
export interface Sticker {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
  font: FontRole;
  glow: boolean;
}

/** A camera handle returned by {@link getCamera}, real or simulated. */
export interface Camera {
  stream: DemoCapableStream;
  demo: boolean;
  /** True when getUserMedia rejected with NotAllowedError (permission blocked). */
  denied?: boolean;
}

/** MediaStream augmented with the demo-canvas teardown hook. */
export interface DemoCapableStream extends MediaStream {
  __demo?: boolean;
  __stopDemo?: () => void;
}

/** Everything {@link drawFrame} needs to render one card. */
export interface FrameOptions {
  layout: Layout;
  skin: Skin;
  shots: Array<Shot | undefined>;
  filter: Filter;
  beautify?: number;
  dateStamp: boolean;
  stickers: Sticker[];
  info: FrameInfo;
  /** Pre-loaded overlay image for canvas rendering (filled by renderStill/renderVideo). */
  overlayEl?: HTMLImageElement;
}

/** A drawable for a single slot, resolved per export type (still vs. video). */
export interface SlotMedia {
  el: CanvasImageSource;
  mirror: boolean;
  isVideo?: boolean;
  mw?: number;
  mh?: number;
}

export interface RenderedVideo {
  blob: Blob;
  mime: string;
}
