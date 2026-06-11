import { useCallback, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { Camera, Shot } from '@/types';
import { captureStill, recordClip } from '@/lib/camera';
import { uid } from '@/lib/canvas';
import type { SoundEffect } from '@/lib/sound';

export const MAX_SHOTS = 10;
const CLIP_MS = 2800;
const COUNTDOWN_STEP_MS = 900;
const AFTER_SHOT_MS = 700;
const FLASH_MS = 180;

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

interface Params {
  videoRef: RefObject<HTMLVideoElement>;
  camera: Camera | null;
  mirror: boolean;
  shots: Shot[];
  setShots: Dispatch<SetStateAction<Shot[]>>;
  play: (effect: SoundEffect) => void;
}

/**
 * Drive the capture flow: a single shutter press, an auto countdown sequence,
 * and shot removal. Each shot grabs a still immediately, then records a short
 * looping clip in the background. The async auto-loop reads shot count and the
 * stop flag through refs so it stays correct across re-renders.
 */
export function useCaptureSequence({ videoRef, camera, mirror, shots, setShots, play }: Params) {
  const [running, setRunning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);

  const stopRequested = useRef(false);
  const shotsRef = useRef(shots);
  shotsRef.current = shots;

  const snapOne = useCallback(async (): Promise<boolean> => {
    if (shotsRef.current.length >= MAX_SHOTS || !videoRef.current || !camera) return false;

    play('shutter');
    setFlash(true);
    window.setTimeout(() => setFlash(false), FLASH_MS);

    const img = captureStill(videoRef.current, mirror);
    const id = uid();
    // The still is added at once; the clip backfills when recording finishes.
    setShots((prev) => [...prev, { id, img, clipUrl: null, mirror: false }]);

    const blob = await recordClip(camera.stream, CLIP_MS);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setShots((prev) => prev.map((s) => (s.id === id ? { ...s, clipUrl: url, mirror } : s)));
    }
    return true;
  }, [camera, mirror, play, setShots, videoRef]);

  const runAuto = useCallback(
    async (count: number) => {
      setRunning(true);
      stopRequested.current = false;
      const total = Math.min(count, MAX_SHOTS - shotsRef.current.length);

      for (let i = 0; i < total && !stopRequested.current; i++) {
        // Re-check live count before each countdown — guards against stale `total`
        // (double-start race, shots deleted mid-sequence, etc.)
        if (shotsRef.current.length >= MAX_SHOTS) break;

        for (let c = 5; c >= 1 && !stopRequested.current; c--) {
          setCountdown(c);
          play(c === 1 ? 'beepHigh' : 'beep');
          await delay(COUNTDOWN_STEP_MS);
        }
        setCountdown(null);
        if (stopRequested.current) break;
        const taken = await snapOne();
        if (!taken) break; // cap hit mid-sequence
        await delay(AFTER_SHOT_MS);
      }

      setCountdown(null);
      setRunning(false);
    },
    [play, snapOne],
  );

  const stop = useCallback(() => {
    stopRequested.current = true;
  }, []);

  const removeShot = useCallback(
    (id: string) => {
      setShots((prev) => {
        const victim = prev.find((s) => s.id === id);
        if (victim?.clipUrl) URL.revokeObjectURL(victim.clipUrl);
        return prev.filter((s) => s.id !== id);
      });
    },
    [setShots],
  );

  return { running, countdown, flash, snapOne, runAuto, stop, removeShot };
}
