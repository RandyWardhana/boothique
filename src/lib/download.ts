/** Browser download + Web Share helpers for exported photos and videos. */

/** Trigger a download of a Blob, cleaning up the object URL afterward. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Download a canvas as a PNG. */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename);
  }, 'image/png');
}

export type ShareResult = 'shared' | 'aborted' | 'failed' | 'unsupported';

/** Share files via the Web Share API, degrading to URL share then unsupported. */
export async function shareFiles(files: File[], title: string): Promise<ShareResult> {
  if (navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files, title });
      return 'shared';
    } catch (err) {
      return err instanceof Error && err.name === 'AbortError' ? 'aborted' : 'failed';
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title, url: location.href });
      return 'shared';
    } catch (err) {
      return err instanceof Error && err.name === 'AbortError' ? 'aborted' : 'failed';
    }
  }
  return 'unsupported';
}

/** Share a URL via the native share sheet (e.g. the 72-hour booth link). */
export async function shareUrl(url: string, title: string): Promise<ShareResult> {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch (err) {
      return err instanceof Error && err.name === 'AbortError' ? 'aborted' : 'failed';
    }
  }
  return 'unsupported';
}
