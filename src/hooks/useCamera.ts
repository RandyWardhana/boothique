import { useCallback, useEffect, useRef, useState } from 'react';
import type { Camera, DemoCapableStream } from '@/types';
import { getCamera } from '@/lib/camera';

function stopStream(stream: DemoCapableStream): void {
  stream.__stopDemo?.();
  stream.getTracks().forEach((t) => t.stop());
}

/**
 * Acquire and own a camera for the given facing mode. Hands back a `videoRef`
 * to bind to a `<video>`, the resolved {@link Camera}, and whether it fell back
 * to the demo stream. The stream is torn down when `facing` changes or on
 * unmount, so callers never juggle MediaStream lifecycles themselves.
 */
export function useCamera(facing: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const attach = useCallback((stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  // Acquire the stream for the requested facing mode.
  useEffect(() => {
    let alive = true;
    let current: DemoCapableStream | null = null;
    getCamera(facing).then((cam) => {
      if (!alive) {
        stopStream(cam.stream);
        return;
      }
      current = cam.stream;
      setCamera(cam);
      attach(cam.stream);
    });
    return () => {
      alive = false;
      if (current) stopStream(current);
    };
  }, [facing, attach, retryCount]);

  // Re-bind if React swapped the <video> element or it lost its stream.
  useEffect(() => {
    const video = videoRef.current;
    if (camera && video && (video.srcObject !== camera.stream || video.paused)) {
      attach(camera.stream);
    }
  });

  const retryCamera = useCallback(() => {
    setCamera(null);
    setRetryCount((n) => n + 1);
  }, []);

  return {
    videoRef,
    camera,
    isDemo: Boolean(camera?.demo),
    permissionDenied: Boolean(camera?.denied),
    retryCamera,
  };
}
