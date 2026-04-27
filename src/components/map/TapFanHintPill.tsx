import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Hand } from 'lucide-react';

interface TapFanHintPillProps {
  /** Number of currently-visible solo fan markers — re-triggers pill when it grows */
  fanCount: number;
}

/**
 * Floating pill prompt that fades in on map open, fades out after a few seconds,
 * and re-appears on zoom-in or when new fans appear nearby.
 */
export function TapFanHintPill({ fanCount }: TapFanHintPillProps) {
  const map = useMap();
  const [visible, setVisible] = useState(true);

  // Auto-hide after 4s whenever it becomes visible
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [visible]);

  // Re-show when fan count increases (new fans nearby)
  useEffect(() => {
    if (fanCount > 0) setVisible(true);
  }, [fanCount]);

  // Re-show on zoom-in
  useEffect(() => {
    if (!map) return;
    let lastZoom = map.getZoom();
    const onZoom = () => {
      const z = map.getZoom();
      if (z > lastZoom) setVisible(true);
      lastZoom = z;
    };
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map]);

  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none absolute top-3 left-1/2 z-[1100] -translate-x-1/2 transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
      }`}
    >
      <div
        className="flex items-center gap-2 rounded-full px-3.5 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.25)] ring-1 ring-white/30"
        style={{
          background: 'linear-gradient(135deg, #0E3386 0%, #2B5FBF 100%)',
        }}
      >
        <Hand className="h-3.5 w-3.5 text-[#FDB827]" strokeWidth={2.5} />
        <span
          className="text-[12px] font-bold uppercase tracking-wide text-white"
          style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.5px' }}
        >
          Tap a fan to say hi!
        </span>
      </div>
    </div>
  );
}
