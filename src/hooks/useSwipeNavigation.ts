import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Main screens that participate in horizontal swipe nav.
// Order matters: swipe LEFT goes to Map, swipe RIGHT goes to Meetups.
const SWIPE_ENABLED = ['/discover', '/bar-map', '/meetups'];

interface Options {
  /** Minimum horizontal distance (px) to trigger nav. */
  threshold?: number;
  /** Max vertical drift (px) — beyond this we treat it as a vertical scroll. */
  maxVertical?: number;
}

/**
 * Adds Instagram/Bumble-style horizontal swipe navigation:
 *  - swipe LEFT  → /bar-map
 *  - swipe RIGHT → /meetups
 *
 * Vertical scrolling is preserved (we bail if vertical drift dominates).
 */
export function useSwipeNavigation({ threshold = 70, maxVertical = 60 }: Options = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!SWIPE_ENABLED.includes(location.pathname)) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      // Ignore multi-touch (pinch-to-zoom on map, etc.)
      if (e.touches.length !== 1) {
        tracking = false;
        return;
      }
      const t = e.touches[0];
      // Avoid hijacking gestures inside scrollable horizontal carousels / map
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-no-swipe-nav], .leaflet-container, [data-radix-scroll-area-viewport]')) {
        tracking = false;
        return;
      }
      startX = t.clientX;
      startY = t.clientY;
      startT = Date.now();
      tracking = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startT;

      if (Math.abs(dy) > maxVertical) return; // vertical scroll
      if (Math.abs(dx) < threshold) return;
      if (dt > 600) return; // too slow → ignore

      if (dx < 0) {
        // swipe left → Map
        if (location.pathname !== '/bar-map') {
          edgeFlash('left');
          navigate('/bar-map');
        }
      } else {
        // swipe right → Meetups
        if (location.pathname !== '/meetups') {
          edgeFlash('right');
          navigate('/meetups');
        }
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [navigate, location.pathname, threshold, maxVertical]);
}

/** Brief edge flash animation to give swipe feedback. */
function edgeFlash(side: 'left' | 'right') {
  const el = document.createElement('div');
  el.className = `swipe-edge-flash swipe-edge-flash--${side}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 350);
}
