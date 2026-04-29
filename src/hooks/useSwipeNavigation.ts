import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/haptics';

// Main screens that participate in horizontal swipe nav.
const SWIPE_ENABLED = ['/discover', '/bar-map', '/meetups'];

const ACTIVATION_PCT = 0.20;   // 20% of screen width
const CANCEL_PCT     = 0.15;   // < 15% → cancel
const VELOCITY_PX_S  = 380;    // px/sec

interface Options {
  /** Max vertical drift (px) before we treat as a vertical scroll. */
  maxVertical?: number;
}

/**
 * Polished horizontal swipe nav.
 *  - swipe LEFT  → /bar-map
 *  - swipe RIGHT → /meetups
 *
 * Live-drag follows the finger (foreground 100%, background 40% via .swipe-drag-bg).
 * If the gesture crosses the activation threshold OR the velocity threshold,
 * the route transitions with a 260ms cubic-bezier slide. Otherwise the screen
 * elastically snaps back.
 */
export function useSwipeNavigation({ maxVertical = 60 }: Options = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!SWIPE_ENABLED.includes(location.pathname)) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let dragging = false;
    let intent: 'horizontal' | 'vertical' | null = null;

    const setDragX = (px: number) => {
      document.body.style.setProperty('--drag-x', `${px}px`);
    };
    const clearDrag = () => {
      document.body.style.removeProperty('--drag-x');
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { dragging = false; return; }
      const t = e.touches[0];
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-no-swipe-nav], .leaflet-container, [data-radix-scroll-area-viewport]')) {
        dragging = false;
        return;
      }
      startX = t.clientX;
      startY = t.clientY;
      startT = Date.now();
      dragging = true;
      intent = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      // Lock intent on first decisive movement
      if (intent === null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        intent = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'horizontal' : 'vertical';
        if (intent === 'vertical') { dragging = false; return; }
      }

      // Live drag with mild rubber-banding
      const w = window.innerWidth || 360;
      const ratio = Math.min(1, Math.abs(dx) / w);
      const eased = (1 - Math.pow(1 - ratio, 1.6)) * w * Math.sign(dx);
      setDragX(eased);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!dragging) { clearDrag(); return; }
      dragging = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Math.max(1, Date.now() - startT);
      const w = window.innerWidth || 360;
      const velocity = Math.abs(dx) / (dt / 1000);

      // Vertical scroll → no-op
      if (Math.abs(dy) > maxVertical && Math.abs(dy) > Math.abs(dx)) {
        clearDrag();
        return;
      }

      const pct = Math.abs(dx) / w;
      const committed = pct >= ACTIVATION_PCT || velocity >= VELOCITY_PX_S;
      const cancelled = pct < CANCEL_PCT && velocity < VELOCITY_PX_S;

      if (committed) {
        // Determine destination
        const dir: 'left' | 'right' = dx < 0 ? 'left' : 'right';
        const dest = dir === 'left' ? '/bar-map' : '/meetups';
        if (location.pathname === dest) {
          // Same destination → just spring back
          springBack();
          return;
        }

        haptic('light');                      // crossed threshold
        edgeFlash(dir);
        animateRouteOut(dir, () => {
          clearDrag();
          haptic('medium');                   // arrived
          navigate(dest);
        });
        return;
      }

      if (cancelled) {
        elasticSnap(dx < 0 ? 'left' : 'right');
        clearDrag();
        return;
      }

      // In-between: just spring back
      springBack();
    };

    function springBack() {
      // Animate via inline transition on body var
      const start = parseFloat(getComputedStyle(document.body).getPropertyValue('--drag-x')) || 0;
      const startTs = performance.now();
      const dur = 220;
      const tick = (now: number) => {
        const t = Math.min(1, (now - startTs) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        setDragX(start * (1 - eased));
        if (t < 1) requestAnimationFrame(tick);
        else clearDrag();
      };
      requestAnimationFrame(tick);
    }

    function animateRouteOut(dir: 'left' | 'right', done: () => void) {
      // Brief slide-out completion of the drag transform
      const w = window.innerWidth || 360;
      const start = parseFloat(getComputedStyle(document.body).getPropertyValue('--drag-x')) || 0;
      const target = dir === 'left' ? -w : w;
      const startTs = performance.now();
      const dur = 260;
      // Notify FAB / overlays
      window.dispatchEvent(new CustomEvent('swipe-route-start'));
      const tick = (now: number) => {
        const t = Math.min(1, (now - startTs) / dur);
        // route ease 0.25, 0.8, 0.25, 1 approximation via cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setDragX(start + (target - start) * eased);
        if (t < 1) requestAnimationFrame(tick);
        else {
          done();
          // Allow the next route to mount, then signal end (after one frame)
          requestAnimationFrame(() => window.dispatchEvent(new CustomEvent('swipe-route-end')));
        }
      };
      requestAnimationFrame(tick);
    }

    function elasticSnap(dir: 'left' | 'right') {
      const main = document.querySelector('[data-route-parallax="fg"]') as HTMLElement | null;
      const el = main ?? document.body;
      el.classList.remove('swipe-elastic-left', 'swipe-elastic-right');
      // force reflow for re-trigger
      void el.offsetWidth;
      el.classList.add(dir === 'left' ? 'swipe-elastic-left' : 'swipe-elastic-right');
      setTimeout(() => el.classList.remove('swipe-elastic-left', 'swipe-elastic-right'), 220);
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove',  onTouchMove,  { passive: true });
    document.addEventListener('touchend',   onTouchEnd,   { passive: true });
    document.addEventListener('touchcancel', () => { dragging = false; clearDrag(); }, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove',  onTouchMove);
      document.removeEventListener('touchend',   onTouchEnd);
      clearDrag();
    };
  }, [navigate, location.pathname, maxVertical]);
}

function edgeFlash(side: 'left' | 'right') {
  const el = document.createElement('div');
  el.className = `swipe-edge-flash swipe-edge-flash--${side}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 350);
}
