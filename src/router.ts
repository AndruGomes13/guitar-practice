import { useSyncExternalStore } from 'react';

// Hash-based routing (#/module/tab) so the app works on any static host without server config.

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const getHash = () => window.location.hash;

/** Current route as path segments, e.g. "#/triads/build" -> ["triads", "build"]. */
export function useRoute(): string[] {
  const hash = useSyncExternalStore(subscribe, getHash);
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

export function href(...segments: string[]): string {
  return `#/${segments.join('/')}`;
}
