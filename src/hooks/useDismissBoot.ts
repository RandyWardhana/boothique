import { useEffect } from 'react';

/** Freezes the CSS-animated progress bar at its current position, transitions
 *  it to 100%, then fades the whole boot screen out. */
export function useDismissBoot() {
  useEffect(() => {
    const boot = document.getElementById('boot');
    if (!boot) return;
    const bar = document.getElementById('boot-bar');

    function fadeOut() {
      boot!.style.opacity = '0';
      window.setTimeout(() => boot!.remove(), 420);
    }

    if (!bar) { fadeOut(); return; }

    // 1. Read the current animated width before stopping the animation.
    const barPx = bar.getBoundingClientRect().width;
    const containerPx = bar.parentElement?.getBoundingClientRect().width ?? 160;
    const currentPct = Math.round((barPx / containerPx) * 100);

    // 2. Cancel the keyframe animation and lock to that exact position.
    bar.style.animation = 'none';
    bar.style.width = `${currentPct}%`;

    // 3. Force a reflow so the browser commits the static width before we
    //    start the transition — without this the intermediate state is skipped.
    void bar.offsetWidth;

    // 4. Transition smoothly to 100 %.
    bar.style.transition = 'width 0.5s ease';
    bar.style.width = '100%';

    // 5. Once the bar reaches 100 %, pause briefly then fade out.
    function onFull() {
      window.clearTimeout(fallback);
      window.setTimeout(fadeOut, 220);
    }

    bar.addEventListener('transitionend', onFull, { once: true });
    const fallback = window.setTimeout(onFull, 800);

    return () => {
      bar.removeEventListener('transitionend', onFull);
      window.clearTimeout(fallback);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
