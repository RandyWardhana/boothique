import type { Camera, DemoCapableStream } from '@/types';
import { drawCover } from './canvas';

/**
 * Build a synthetic camera stream from an animated canvas. Used when no webcam
 * is available (denied permission, headless preview) so the booth still works.
 */
export function makeDemoStream(): DemoCapableStream {
  const W = 1280;
  const H = 960;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  // Chromium only delivers captureStream frames for canvases in the render tree,
  // so park it just offscreen rather than using display:none (which skips paint).
  canvas.style.cssText = 'position:fixed;left:-10000px;top:0;width:4px;height:3px;pointer-events:none;';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  const blobs = [
    { c: '#e9694f', r: 320, sx: 0.31, sy: 0.23, px: 0.3, py: 0.35 },
    { c: '#5e8fb8', r: 380, sx: 0.17, sy: 0.29, px: 0.72, py: 0.6 },
    { c: '#e6b450', r: 260, sx: 0.23, sy: 0.13, px: 0.55, py: 0.25 },
  ];

  const stream = canvas.captureStream(0) as DemoCapableStream;
  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
  const start = performance.now();

  function draw(): void {
    const s = (performance.now() - start) / 1000;
    ctx.fillStyle = '#2b2b33';
    ctx.fillRect(0, 0, W, H);
    blobs.forEach((b, i) => {
      const x = (b.px + Math.sin(s * b.sx + i * 2) * 0.18) * W;
      const y = (b.py + Math.cos(s * b.sy + i) * 0.16) * H;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, b.r);
      grad.addColorStop(0, b.c);
      grad.addColorStop(1, 'rgba(43,43,51,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Bouncing diamond.
    const dx = (0.5 + Math.sin(s * 0.7) * 0.32) * W;
    const dy = (0.5 + Math.cos(s * 1.1) * 0.28) * H;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(s * 0.8);
    ctx.fillStyle = '#f0efeb';
    ctx.fillRect(-46, -46, 92, 92);
    ctx.restore();
    ctx.font = '600 54px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(240,239,235,0.85)';
    ctx.fillText('DEMO CAM', W / 2, H - 70);
    track.requestFrame?.();
  }

  draw();
  const timer = window.setInterval(draw, 33);
  stream.__demo = true;
  stream.__stopDemo = () => {
    window.clearInterval(timer);
    canvas.remove();
  };
  return stream;
}

/**
 * Request a webcam, falling back to the demo stream if the user denies access or
 * the permission prompt stalls past a short timeout.
 */
export function getCamera(facing: string = 'user'): Promise<Camera> {
  return new Promise((resolve) => {
    let settled = false;
    const fallback = () => {
      if (!settled) {
        settled = true;
        resolve({ stream: makeDemoStream(), demo: true });
      }
    };
    const timer = window.setTimeout(fallback, 2500);

    try {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        })
        .then((stream) => {
          if (settled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          settled = true;
          window.clearTimeout(timer);
          resolve({ stream: stream as DemoCapableStream, demo: false });
        })
        .catch((err: unknown) => {
          window.clearTimeout(timer);
          const denied = (err instanceof DOMException) && err.name === 'NotAllowedError';
          if (!settled) {
            settled = true;
            resolve({ stream: makeDemoStream(), demo: true, denied });
          }
        });
    } catch {
      window.clearTimeout(timer);
      fallback();
    }
  });
}

/** Pick the best supported recording MIME type, preferring MP4/H.264. */
export function pickMime(): string {
  const candidates = [
    'video/mp4;codecs=avc1.640028',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const mime of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

/** Record a short clip from a live stream. Resolves `null` on any failure. */
export function recordClip(stream: MediaStream, ms = 2800): Promise<Blob | null> {
  return new Promise((resolve) => {
    let recorder: MediaRecorder;
    try {
      const mime = pickMime();
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      resolve(null);
      return;
    }
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      resolve(chunks.length ? new Blob(chunks, { type: recorder.mimeType || 'video/webm' }) : null);
    };
    recorder.onerror = () => resolve(null);
    recorder.start();
    window.setTimeout(() => {
      try {
        recorder.stop();
      } catch {
        resolve(null);
      }
    }, ms);
  });
}

/** Grab a 4:3 still (960×720) from a playing video element, honoring mirror. */
export function captureStill(video: HTMLVideoElement, mirror: boolean): string {
  const W = 960;
  const H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  if (mirror) {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  drawCover(ctx, video, 0, 0, W, H, video.videoWidth || 1280, video.videoHeight || 960);
  return canvas.toDataURL('image/jpeg', 0.92);
}
