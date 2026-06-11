import type { CSSProperties } from 'react';
import type { Filter, FrameInfo, Shot, Skin, Slot } from '@/types';
import { beautifyCss, filterToCss } from '@/lib/filters';

interface FrameSlotProps {
  slot: Slot;
  k: number;
  skin: Skin;
  shot?: Shot;
  filter: Filter;
  beautify?: number;
  dateStamp: boolean;
  info: FrameInfo;
  /** Play the recorded clip instead of the still, when one exists. */
  animated?: boolean;
}

/** A single photo slot in the DOM preview: paper mat, media, and date stamp. */
export function FrameSlot({ slot, k, skin, shot, filter, beautify, dateStamp, info, animated }: FrameSlotProps) {
  const radius = (skin.photo?.radius ?? 0) * k;
  const matColor = skin.photo?.mat ?? (slot.mat ? '#ffffff' : null);
  const filterCss = filterToCss(filter);
  const isVideo = animated && shot?.clipUrl;

  const mediaStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    filter: filterCss === 'none' ? 'none' : filterCss,
    transform: shot?.mirror ? 'scaleX(-1)' : 'none',
  };
  const videoFilter = `${filterCss === 'none' ? '' : filterCss} ${beautifyCss(beautify ?? 0)}`.trim();
  const videoStyle: CSSProperties = { ...mediaStyle, filter: videoFilter || 'none' };

  const cx = (slot.x + slot.w / 2) * k;
  const cy = (slot.y + slot.h / 2) * k;

  return (
    <div
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        width: slot.w * k,
        height: slot.h * k,
        transform: `translate(-50%,-50%)${slot.rotate ? ` rotate(${slot.rotate}deg)` : ''}`,
      }}
    >
      {slot.mat ? (
        <div
          style={{
            position: 'absolute',
            left: -slot.mat.pad * k,
            top: -slot.mat.pad * k,
            width: (slot.w + slot.mat.pad * 2) * k,
            height: (slot.h + slot.mat.pad + slot.mat.padBottom) * k,
            background: matColor ?? '#ffffff',
            boxShadow: `0 ${4 * k}px ${14 * k}px rgba(0,0,0,0.3)`,
          }}
        />
      ) : matColor ? (
        <div
          style={{
            position: 'absolute',
            left: -10 * k,
            top: -10 * k,
            width: (slot.w + 20) * k,
            height: (slot.h + 20) * k,
            background: matColor,
            borderRadius: radius + 5 * k,
          }}
        />
      ) : null}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          borderRadius: radius,
          background: 'rgba(127,127,127,0.25)',
          border: skin.photo?.stroke ? `${Math.max(1, 3 * k)}px solid ${skin.photo.stroke}` : 'none',
          boxSizing: 'border-box',
        }}
      >
        {shot ? (
          isVideo ? (
            <video
              src={shot.clipUrl!}
              style={videoStyle}
              autoPlay
              loop
              muted
              playsInline
              ref={(el) => {
                if (el) {
                  el.muted = true;
                  el.play().catch(() => {});
                }
              }}
            />
          ) : (
            <img src={shot.img} alt="" style={mediaStyle} />
          )
        ) : null}
      </div>

      {dateStamp ? (
        <div
          style={{
            position: 'absolute',
            right: 22 * k,
            bottom: 14 * k,
            whiteSpace: 'nowrap',
            fontFamily: "'VT323', monospace",
            fontSize: Math.max(26, slot.w * 0.085) * k,
            color: '#ffb05c',
            textShadow: `0 0 ${8 * k}px rgba(255,120,30,0.9)`,
            lineHeight: 1,
          }}
        >
          {info.date}
        </div>
      ) : null}
    </div>
  );
}
