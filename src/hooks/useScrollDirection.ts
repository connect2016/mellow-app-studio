import { useEffect, useState } from 'react';

/**
 * Tracks vertical scroll direction. Used by the FAB hide/reveal behavior.
 *  - 'down'  → user is actively scrolling content down (hide FAB)
 *  - 'up'    → scrolling up or near top (reveal FAB)
 */
export function useScrollDirection(threshold = 6) {
  const [dir, setDir] = useState<'up' | 'down'>('up');

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      if (Math.abs(dy) > threshold) {
        const next: 'up' | 'down' = dy > 0 && y > 80 ? 'down' : 'up';
        setDir((prev) => (prev === next ? prev : next));
        lastY = y;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return dir;
}
