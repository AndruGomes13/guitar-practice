import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

/** A single pending timeout that is cleared on unmount or when rescheduled. */
export function useTimeout() {
  const ref = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(ref.current), []);
  const schedule = useCallback((fn: () => void, ms: number) => {
    window.clearTimeout(ref.current);
    ref.current = window.setTimeout(fn, ms);
  }, []);
  const cancel = useCallback(() => window.clearTimeout(ref.current), []);
  return useMemo(() => ({ schedule, cancel }), [schedule, cancel]);
}

export function useMediaQuery(query: string): boolean {
  const mql = useMemo(() => window.matchMedia(query), [query]);
  return useSyncExternalStore(
    (onChange) => {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => mql.matches,
  );
}
