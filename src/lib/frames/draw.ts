import type { FontRole, FrameOptions, Prim, Skin, SlotMedia } from '@/types';
import { DIRECTIONS } from '@/config/directions';
import { beautifyCss, filterToCss } from '../filters';
import { drawCover } from '../canvas';

/** Resolve a skin's font for a given role to a CSS font-family string. */
export function frameFont(skin: Skin, role: FontRole): string {
  if (role === 'stamp') return "'VT323', monospace";
  const fonts = skin.fonts ?? (DIRECTIONS[skin.dir] ?? DIRECTIONS.seoul).fonts;
  return role === 'display' ? fonts.display : fonts.body;
}

/** Draw a list of decoration primitives onto a 2D context. */
export function drawPrims(ctx: CanvasRenderingContext2D, prims: Prim[], skin: Skin): void {
  prims.forEach((p) => {
    ctx.save();
    if (p.alpha != null) ctx.globalAlpha = p.alpha;
    if (p.glow) {
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = (p.size ?? 20) * 0.6;
    }

    if (p.type === 'rect') {
      ctx.translate(p.x + (p.w || 0) / 2, p.y + (p.h || 0) / 2);
      if (p.rotate) ctx.rotate((p.rotate * Math.PI) / 180);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, p.r || 0);
      else ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
      if (p.fill && p.fill !== 'none') {
        ctx.fillStyle = p.fill;
        ctx.fill();
      }
      if (p.stroke) {
        ctx.strokeStyle = p.stroke;
        ctx.lineWidth = p.strokeW || 2;
        if (p.dash) ctx.setLineDash(p.dash);
        ctx.stroke();
      }
    } else if (p.type === 'circle') {
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.fill;
      ctx.fill();
    } else {
      ctx.translate(p.x, p.y);
      if (p.rotate) ctx.rotate((p.rotate * Math.PI) / 180);
      ctx.font = `${p.weight || 400} ${p.size}px ${frameFont(skin, p.font || 'body')}`;
      ctx.fillStyle = p.color;
      ctx.textAlign = p.align || 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.text, 0, 0);
    }

    ctx.restore();
  });
}

type MediaResolver = (slotIndex: number) => SlotMedia | null;

/**
 * Render a full framed card onto `ctx`. Shared by the still and video exports;
 * `getMedia` supplies the drawable (image or playing video) for each slot.
 */
export function drawFrame(ctx: CanvasRenderingContext2D, opts: FrameOptions, getMedia: MediaResolver): void {
  const { layout: L, skin, info } = opts;

  // Background.
  if (typeof skin.bg === 'object' && skin.bg.grad) {
    const grad = ctx.createLinearGradient(0, 0, 0, L.h);
    grad.addColorStop(0, skin.bg.grad[0]);
    grad.addColorStop(1, skin.bg.grad[1]);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = typeof skin.bg === 'string' ? skin.bg : '#ffffff';
  }
  ctx.fillRect(0, 0, L.w, L.h);

  const decor = skin.decor(L, info);
  drawPrims(ctx, decor.under, skin);

  const filterCss = filterToCss(opts.filter);
  const beautyCss = beautifyCss(opts.beautify ?? opts.filter.beautify ?? 0);
  const photoRadius = skin.photo?.radius ?? 0;

  L.slots.forEach((slot, i) => {
    const media = getMedia(i);
    ctx.save();
    ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
    if (slot.rotate) ctx.rotate((slot.rotate * Math.PI) / 180);

    // Paper mat behind the photo.
    const matColor = skin.photo?.mat ?? (slot.mat ? '#ffffff' : null);
    if (slot.mat) {
      const m = slot.mat;
      ctx.fillStyle = matColor || '#ffffff';
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.fillRect(-slot.w / 2 - m.pad, -slot.h / 2 - m.pad, slot.w + m.pad * 2, slot.h + m.pad + m.padBottom);
      ctx.restore();
    } else if (matColor) {
      const pad = 10;
      ctx.fillStyle = matColor;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-slot.w / 2 - pad, -slot.h / 2 - pad, slot.w + pad * 2, slot.h + pad * 2, photoRadius + pad / 2);
      } else {
        ctx.rect(-slot.w / 2 - pad, -slot.h / 2 - pad, slot.w + pad * 2, slot.h + pad * 2);
      }
      ctx.fill();
    }

    // Photo — clipped to the slot, filtered, and mirrored if needed.
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h, photoRadius);
    else ctx.rect(-slot.w / 2, -slot.h / 2, slot.w, slot.h);
    ctx.clip();
    if (media?.el) {
      const composed = media.isVideo
        ? `${filterCss === 'none' ? '' : filterCss} ${beautyCss}`.trim()
        : filterCss;
      try {
        ctx.filter = composed || 'none';
      } catch {
        /* filter unsupported on this context */
      }
      if (media.mirror) ctx.scale(-1, 1);
      drawCover(ctx, media.el, -slot.w / 2, -slot.h / 2, slot.w, slot.h, media.mw, media.mh);
      try {
        ctx.filter = 'none';
      } catch {
        /* noop */
      }
    } else {
      ctx.fillStyle = 'rgba(127,127,127,0.25)';
      ctx.fillRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h);
    }
    ctx.restore();

    // Photo stroke.
    if (skin.photo?.stroke) {
      ctx.strokeStyle = skin.photo.stroke;
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h, photoRadius);
      else ctx.rect(-slot.w / 2, -slot.h / 2, slot.w, slot.h);
      ctx.stroke();
    }

    // Date stamp inside the slot.
    if (opts.dateStamp) {
      const size = Math.max(26, slot.w * 0.085);
      ctx.font = `400 ${size}px 'VT323', monospace`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = 'rgba(255,120,30,0.9)';
      ctx.shadowBlur = size * 0.35;
      ctx.fillStyle = '#ffb05c';
      ctx.fillText(info.date, slot.w / 2 - 22, slot.h / 2 - 18);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  });

  drawPrims(ctx, decor.over, skin);

  // Custom overlay PNG — transparent frame drawn over photos, under stickers.
  if (opts.overlayEl) {
    ctx.drawImage(opts.overlayEl, 0, 0, L.w, L.h);
  }

  // Stickers, always on top.
  opts.stickers.forEach((st) => {
    ctx.save();
    ctx.translate(st.x, st.y);
    if (st.rotate) ctx.rotate((st.rotate * Math.PI) / 180);
    ctx.font = `700 ${st.size}px ${frameFont(skin, st.font || 'display')}`;
    ctx.fillStyle = st.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (st.glow) {
      ctx.shadowColor = st.color;
      ctx.shadowBlur = st.size * 0.4;
    }
    ctx.fillText(st.text, 0, 0);
    ctx.restore();
  });
}
