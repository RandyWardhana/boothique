import { useEffect, useState } from 'react';
import type { Shot } from '@/types';
import { beautifyShot } from '@/lib/beautify';

/**
 * Beautify an ordered list of shots, recomputing only when the selection or
 * strength changes. Returns the originals immediately when strength is 0, and
 * swaps in beautified copies once the async pass resolves.
 */
export function useBeautifiedShots(ordered: Array<Shot | undefined>, amount: number): Array<Shot | undefined> {
  const [beautified, setBeautified] = useState(ordered);
  const signature = ordered.map((s) => s?.id).join(',');

  useEffect(() => {
    if (!amount) {
      setBeautified(ordered);
      return;
    }
    let alive = true;
    Promise.all(ordered.map((s) => (s ? beautifyShot(s, amount) : Promise.resolve(s)))).then((result) => {
      if (alive) setBeautified(result);
    });
    return () => {
      alive = false;
    };
    // `signature` captures the relevant identity of `ordered` without re-running
    // on every new array reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, amount]);

  return amount ? beautified : ordered;
}
