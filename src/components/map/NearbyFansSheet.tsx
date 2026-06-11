import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Beer, Hand } from 'lucide-react';
import { GateFilterChips } from './GateFilterChips';
import { type GateFilter } from '@/hooks/useFanMapPins';
import type { MapFan } from './useMapClusters';

type Snap = 'collapsed' | 'half' | 'full';
const SNAP_VH: Record<Snap, number> = { collapsed: 15, half: 45, full: 85 };

interface Props {
  fans: MapFan[];
  totalCount: number;
  selectedGate: GateFilter | null;
  onSelectGate: (g: GateFilter | null) => void;
  gateCounts: Partial<Record<GateFilter, number>>;
  onSayHi: (fan: MapFan) => void;
  onBuyBeer: (fan: MapFan) => void;
}

/**
 * Fixed bottom sheet anchored to viewport bottom (above bottom nav).
 * 3 snap points: 15% / 45% / 85% of viewport height.
 * Touch-drag on the handle snaps to the nearest point.
 */
export function NearbyFansSheet({
  fans,
  totalCount,
  selectedGate,
  onSelectGate,
  gateCounts,
  onSayHi,
  onBuyBeer,
}: Props) {
  const [snap, setSnap] = useState<Snap>('collapsed');
  const [dragOffset, setDragOffset] = useState(0); // px during drag
  const startYRef = useRef<number | null>(null);
  const startHeightRef = useRef<number>(0);

  const heightVh = SNAP_VH[snap];

  const onTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    startHeightRef.current = (window.innerHeight * heightVh) / 100;
    setDragOffset(0);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current == null) return;
    const dy = e.touches[0].clientY - startYRef.current;
    setDragOffset(dy); // positive = dragged down
  };
  const onTouchEnd = () => {
    if (startYRef.current == null) return;
    const newHeightPx = startHeightRef.current - dragOffset;
    const newVh = (newHeightPx / window.innerHeight) * 100;
    // Snap to nearest of [15, 45, 85]
    const snaps: Snap[] = ['collapsed', 'half', 'full'];
    let best: Snap = 'collapsed';
    let bestDist = Infinity;
    for (const s of snaps) {
      const d = Math.abs(SNAP_VH[s] - newVh);
      if (d < bestDist) { bestDist = d; best = s; }
    }
    setSnap(best);
    setDragOffset(0);
    startYRef.current = null;
  };

  // Tap handle: cycle collapsed → half → full → collapsed
  const onHandleClick = () => {
    setSnap((s) => (s === 'collapsed' ? 'half' : s === 'half' ? 'full' : 'collapsed'));
  };

  // Lock page scroll when full
  useEffect(() => {
    if (snap === 'full') {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [snap]);

  // Computed style: drag is live, otherwise transition snap
  const liveHeightPx = (window.innerHeight * heightVh) / 100 - dragOffset;
  const style: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 'env(safe-area-inset-bottom)',
    zIndex: 45,
    height: `${Math.max(60, liveHeightPx)}px`,
    transition: dragOffset === 0 ? 'height 220ms cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
    background: 'hsl(var(--background))',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTop: '0.5px solid hsl(var(--border))',
    boxShadow: '0 -8px 24px -8px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={style} aria-label="Nearby fans">
      {/* Drag handle */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onHandleClick}
        className="flex flex-col items-center gap-2 pt-2 pb-1 cursor-grab active:cursor-grabbing select-none touch-none"
        role="button"
        aria-label="Drag to resize"
      >
        <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
      </div>

      {/* Header (always visible) */}
      <div className="px-4 pt-1 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">
            Fans Nearby
            <span className="ml-2 text-xs font-medium text-muted-foreground tabular-nums">
              {fans.length}{selectedGate && fans.length !== totalCount ? ` of ${totalCount}` : ''}
            </span>
          </h3>
          {selectedGate && (
            <button
              onClick={() => onSelectGate(null)}
              className="text-[11px] font-semibold text-[hsl(var(--brand-navy))]"
            >
              Clear
            </button>
          )}
        </div>
        <GateFilterChips selected={selectedGate} onSelect={onSelectGate} counts={gateCounts} />
      </div>

      {/* Scrollable list */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom))',
        }}
      >
        {fans.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No fans here yet — check back during gameday.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {fans.map((fan) => (
              <li key={fan.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={fan.photo ?? undefined} alt="" />
                  <AvatarFallback className="bg-[hsl(var(--brand-navy))] text-white font-bold">
                    {fan.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{fan.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{fan.locationLabel}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onBuyBeer(fan)}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    aria-label={`Buy ${fan.name} a beer`}
                  >
                    <Beer className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onSayHi(fan)}
                    className="min-h-[44px] px-3 inline-flex items-center justify-center gap-1 rounded-full bg-[hsl(var(--brand-navy))] text-white text-xs font-bold"
                  >
                    <Hand className="h-3.5 w-3.5" /> Say Hi
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
