import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { FrameOptions, RenderedVideo, Shot, SlotMedia } from '@/types';
import { loadImage } from '../canvas';
import { pickMime } from '../camera';
import { drawFrame } from './draw';

export type ProgressCallback = (fraction: number) => void;

const VIDEO_DURATION_MS = 5000;

/** Render the framed still to an off-screen canvas (caller reads pixels/PNG). */
export async function renderStill(opts: FrameOptions): Promise<HTMLCanvasElement> {
  const images = await Promise.all(opts.shots.map((s) => loadImage((s as Shot).img)));
  let overlayEl: HTMLImageElement | undefined;
  if (opts.skin.overlay) {
    try { overlayEl = await loadImage(opts.skin.overlay); } catch { /* CORS or network — skip */ }
  }
  const canvas = document.createElement('canvas');
  canvas.width = opts.layout.w;
  canvas.height = opts.layout.h;
  const ctx = canvas.getContext('2d')!;
  drawFrame(ctx, { ...opts, overlayEl }, (i) => ({ el: images[i], mirror: (opts.shots[i] as Shot).mirror }));
  return canvas;
}

/** Prepare a `<video>` clip, resolving once it can play (or `null` on error). */
function prepVideo(url: string): Promise<HTMLVideoElement | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'auto';
    let settled = false;
    const ok = () => {
      if (!settled) {
        settled = true;
        resolve(video);
      }
    };
    video.addEventListener('canplay', ok);
    video.addEventListener('error', () => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    });
    window.setTimeout(ok, 4000);
    video.src = url;
    video.load();
  });
}

/** Resolve per-slot media for the video export: clip when present, else still. */
async function prepSlotMedia(shots: Array<Shot | undefined>): Promise<SlotMedia[]> {
  const media: SlotMedia[] = [];
  for (const shot of shots) {
    const s = shot as Shot;
    let el: HTMLVideoElement | HTMLImageElement | null = null;
    if (s.clipUrl) el = await prepVideo(s.clipUrl);
    if (!el) el = await loadImage(s.img);
    media.push({ el, mirror: s.mirror, isVideo: el instanceof HTMLVideoElement });
  }
  await Promise.all(
    media.flatMap((m) => {
      if (!m.isVideo) return [];
      const p = (m.el as HTMLVideoElement).play();
      return p ? [p.catch(() => {})] : [];
    }),
  );
  return media;
}

function releaseSlotMedia(media: SlotMedia[]): void {
  media.forEach((m) => {
    if (m.isVideo) {
      try {
        const video = m.el as HTMLVideoElement;
        video.pause();
        video.src = '';
      } catch {
        /* noop */
      }
    }
  });
}

/** Encode an MP4 via WebCodecs + mp4-muxer. Throws when unsupported. */
async function renderVideoMp4(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  scale: number,
  opts: FrameOptions,
  media: SlotMedia[],
  onProgress?: ProgressCallback,
): Promise<RenderedVideo> {
  if (!('VideoEncoder' in window)) throw new Error('WebCodecs unavailable');

  const W = canvas.width;
  const H = canvas.height;
  const config: VideoEncoderConfig = { codec: 'avc1.640028', width: W, height: H, bitrate: 8_000_000, framerate: 30 };
  const support = await VideoEncoder.isConfigSupported(config);
  if (!support.supported) throw new Error('avc unsupported');

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: W, height: H },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  let encoderError: unknown = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      encoderError = e;
    },
  });
  encoder.configure(config);

  await new Promise<void>((resolve, reject) => {
    const start = performance.now();
    let raf = 0;
    let last = -1e9;
    let count = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      resolve();
    };

    const frame = (now: number) => {
      if (encoderError) {
        finished = true;
        cancelAnimationFrame(raf);
        reject(encoderError);
        return;
      }
      const elapsed = now - start;
      if (elapsed >= VIDEO_DURATION_MS) {
        finish();
        return;
      }
      if (now - last >= 1000 / 30 - 1) {
        last = now;
        ctx.save();
        ctx.scale(scale, scale);
        drawFrame(ctx, opts, (i) => media[i]);
        ctx.restore();
        const videoFrame = new VideoFrame(canvas, { timestamp: Math.round(elapsed * 1000) });
        encoder.encode(videoFrame, { keyFrame: count % 60 === 0 });
        videoFrame.close();
        count++;
      }
      onProgress?.(Math.min(0.96, (elapsed / VIDEO_DURATION_MS) * 0.96));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  });

  await encoder.flush();
  muxer.finalize();
  onProgress?.(1);
  return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), mime: 'video/mp4' };
}

/** Fallback: real-time capture via MediaRecorder (MP4 on Safari, else WebM). */
function renderVideoRecorder(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  scale: number,
  opts: FrameOptions,
  media: SlotMedia[],
  onProgress?: ProgressCallback,
): Promise<RenderedVideo> {
  const mime = pickMime();
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };

  const start = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    ctx.save();
    ctx.scale(scale, scale);
    drawFrame(ctx, opts, (i) => media[i]);
    ctx.restore();
    onProgress?.(Math.min(0.98, (now - start) / VIDEO_DURATION_MS));
    if (now - start < VIDEO_DURATION_MS) raf = requestAnimationFrame(frame);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      cancelAnimationFrame(raf);
      onProgress?.(1);
      const type = recorder.mimeType || 'video/webm';
      resolve({ blob: new Blob(chunks, { type }), mime: type });
    };
    recorder.start(200);
    raf = requestAnimationFrame(frame);
    window.setTimeout(() => {
      try {
        recorder.stop();
      } catch {
        resolve({ blob: new Blob(chunks, { type: 'video/webm' }), mime: 'video/webm' });
      }
    }, VIDEO_DURATION_MS + 150);
  });
}

/** Render the animated framed video. `onProgress` tracks the encode (0–1). */
export async function renderVideo(opts: FrameOptions, onProgress?: ProgressCallback): Promise<RenderedVideo> {
  const L = opts.layout;
  const scale = Math.min(1, 1280 / Math.max(L.w, L.h));
  const canvas = document.createElement('canvas');
  // Even dimensions are required for H.264.
  canvas.width = Math.round((L.w * scale) / 2) * 2;
  canvas.height = Math.round((L.h * scale) / 2) * 2;
  const ctx = canvas.getContext('2d')!;

  let overlayEl: HTMLImageElement | undefined;
  if (opts.skin.overlay) {
    try { overlayEl = await loadImage(opts.skin.overlay); } catch { /* CORS or network — skip */ }
  }
  const optsWithOverlay = overlayEl ? { ...opts, overlayEl } : opts;

  const media = await prepSlotMedia(opts.shots);
  try {
    return await renderVideoMp4(canvas, ctx, scale, optsWithOverlay, media, onProgress);
  } catch {
    return await renderVideoRecorder(canvas, ctx, scale, optsWithOverlay, media, onProgress);
  } finally {
    releaseSlotMedia(media);
  }
}
