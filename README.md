# Boothique

> Snap a strip, frame it cute, keep it moving.

A browser-based photo booth — capture a roll of stills, pick a layout, tune filters, decorate your frame with stickers, and export a framed PNG + animated MP4. Entirely client-side. Installable as a PWA.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white&style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4?logo=tailwindcss&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white&style=flat-square)
![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8?logo=pwa&logoColor=white&style=flat-square)

---

## Features

- **5-count auto capture** — start a hands-free sequence of ×4, ×6, or ×8 shots with a countdown and shutter sound
- **Multiple layouts** — strip, grid, polaroid, wide, and collage
- **Live filter preview** — apply and compare filters before exporting
- **Frame skins** — three skin collections (core, girlie, occasion) with decorative overlays and sticker placement
- **PNG + MP4 export** — full-res framed still via Canvas 2D; animated clip via WebCodecs + [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) (MediaRecorder fallback for Safari)
- **72-hour share links** — publish to a Cloudflare Worker + R2 bucket; the share page is served from your own domain (Vercel)
- **PWA** — installable to home screen; works offline after first load
- **Demo camera** — if webcam access is unavailable, an animated demo stream keeps the whole flow usable
- **i18n** — English and Indonesian
- **Themed UI** — runtime CSS-variable theme engine; light, dark, and system modes; Gaegu font throughout

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS v4 with `@theme` CSS variable mapping |
| UI components | Headless UI v2 (dialogs, bottom sheet, transitions) |
| Canvas rendering | Canvas 2D (frames), WebCodecs + mp4-muxer (MP4), MediaRecorder fallback |
| Audio | WebAudio API |
| PWA | vite-plugin-pwa + Workbox |
| Share backend | Cloudflare Worker + R2 |
| Hosting | Vercel (frontend) |

---

## Getting started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build (typecheck + bundle)
npm run build

# Preview production build locally
npm run preview

# Type-check only
npm run typecheck

# Lint
npm run lint
```

### Environment variables

Copy `.env.example` to `.env`:

```env
# URL of the deployed Cloudflare Worker (optional)
# If unset, share falls back to the browser's native file sharing.
VITE_SHARE_API_BASE=https://your-worker.workers.dev
```

---

## Deployment

### Frontend — Vercel

1. Push the repo to GitHub
2. Import into [Vercel](https://vercel.com)
3. Set `VITE_SHARE_API_BASE` in **Project → Settings → Environment Variables**
4. Deploy — Vercel picks up `vercel.json` automatically (SPA rewrite for `/s/:id`)

### Share backend — Cloudflare Worker

```bash
cd worker
npm install

# Create the R2 bucket
npx wrangler r2 bucket create boothique-shares

# Deploy the Worker
npx wrangler deploy
```

Add an R2 lifecycle rule on the bucket to delete objects after ~4 days as a storage backstop (Dashboard → R2 → bucket → Settings → Object lifecycle rules). Access is already cut off at exactly 72 hours in code.

---

## Architecture

Domain logic is framework-agnostic (`lib/`), side-effects live in hooks (`hooks/`), and components stay declarative (`components/`).

```
src/
├── types.ts                  # shared domain types (Shot, Layout, Skin, …)
├── main.tsx                  # entry — routes /s/:id to SharePage, else App
├── SharePage.tsx             # share result page (fetches Worker /api/meta/:id)
├── config/
│   ├── branding.ts           # brand name, palettes, font pairings, UI scale
│   └── directions.ts         # per-collection design tokens
├── i18n/                     # translations + typed t() / useTranslation
├── lib/
│   ├── camera.ts             # getUserMedia, demo stream, clip recording
│   ├── canvas.ts             # image loading, cover-fit drawing, uid
│   ├── filters.ts            # filter presets + CSS composition
│   ├── beautify.ts           # frequency-separation-lite skin smoothing
│   ├── sound.ts              # WebAudio shutter/beep effects
│   ├── download.ts           # blob/canvas save + Web Share API
│   ├── shareLink.ts          # upload to Worker, build share URL
│   ├── stickers.ts           # sticker palette definitions
│   └── frames/
│       ├── layouts.ts        # card geometries + deterministic scatter
│       ├── skins/            # collections: core / girlie / occasion
│       ├── draw.ts           # canvas frame renderer (still + video)
│       ├── compose.ts        # PNG and MP4/WebM export pipeline
│       └── info.ts           # caption / date info builder
├── hooks/
│   ├── useBoothSession.ts    # session state machine (step + all draft state)
│   ├── useCamera.ts          # camera stream lifecycle
│   ├── useCaptureSequence.ts # shutter + 5-count auto countdown
│   ├── useBeautifiedShots.ts # async beautify with memoization
│   ├── useStillImage.ts      # render framed still to canvas
│   ├── useVideoExport.ts     # encode + download animated strip
│   ├── useShareLink.ts       # upload + share link state
│   ├── useTheme.ts           # resolve tokens → CSS variables
│   ├── useSettings.ts        # persisted preferences (lang, theme, sound)
│   ├── useDismissBoot.ts     # animated boot loader dismiss
│   ├── useInstallPrompt.ts   # PWA beforeinstallprompt capture
│   └── useSound.ts           # sound-enabled play() wrapper
└── components/
    ├── ui/                   # Button, Card, Segmented, ActionBar, SettingsPopover, …
    ├── decor/                # backdrop, hero illustrations, motifs
    ├── FramePreview/         # DOM mirror of the canvas frame renderer
    └── screens/              # Home → Capture → Select → Filter → Frame → Result
```

### Key design decisions

**One renderer, two surfaces.** `lib/frames/draw.ts` renders frames to a `<canvas>` for export; `FramePreview` renders the same spec to the DOM for a crisp, interactive live preview. Both consume identical `Skin` / `Layout` / `Prim` types — a new skin shows up identically in preview and export without any extra wiring.

**Effects quarantined in hooks.** Camera acquisition, capture sequencing, beautify, still/video rendering, theming, and persistence each live in a focused hook. Screen components read as plain markup with no imperative logic.

**Skins are data + a draw function.** Each collection is an array of skins built from shared primitive helpers — no per-skin imperative code, easy to extend.

**Self-referential Worker URLs.** The Cloudflare Worker derives its own origin from `new URL(request.url)` instead of a `PUBLIC_BASE_URL` env var, making it immune to config drift across deploys.

---

## Notes

- Export resolution: frames render at full layout resolution; video is scaled to ≤ 1280 px on the long edge with even dimensions (required for H.264)
- Beautify applies true frequency-separation-lite smoothing to exported stills and a cheaper CSS soft-focus to live/clip video
- The 72-hour share expiry is enforced in Worker code (HTTP `410 Gone`); R2 lifecycle rules are a storage backstop only
