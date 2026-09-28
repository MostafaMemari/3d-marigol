import { useEffect, useState } from 'react';

/**
 * Subscribes to a media query. Used to pick the right presentation for the
 * settings surface (floating panel vs. bottom sheet) instead of rendering
 * both and hiding one with CSS.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
}

/** `sm` breakpoint and up — tablets and desktops get the floating panel. */
export function useIsWide(): boolean {
  return useMediaQuery('(min-width: 640px)');
}
