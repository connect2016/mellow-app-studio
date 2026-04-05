import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Clock, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BarInfo {
  name: string;
  address: string;
  type: string;
  lat: number;
  lng: number;
}

interface Props {
  bar: BarInfo | null;
  onClose: () => void;
}

function getDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}

const BAR_VIBES: Record<string, { emoji: string; vibe: string; hours: string }> = {
  "Murphy's Bleachers": { emoji: '🍺', vibe: 'Classic Cubs bar', hours: 'Opens 2hrs before first pitch' },
  "The Cubby Bear Lounge Chicago": { emoji: '🎸', vibe: 'Live music & sports', hours: '11AM – 2AM' },
  "Mordecai": { emoji: '🍸', vibe: 'Craft cocktails', hours: '4PM – 12AM' },
  "Bernie's": { emoji: '🎉', vibe: 'Party vibes', hours: '11AM – 2AM' },
  "GMAN Tavern": { emoji: '🎶', vibe: 'Indie & chill', hours: '5PM – 2AM' },
};

export function BarDetailSheet({ bar, onClose }: Props) {
  const info = bar ? BAR_VIBES[bar.name] : null;

  return (
    <AnimatePresence>
      {bar && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/20"
            onClick={onClose}
          />
          {/* Bottom Sheet — 60% height */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[2001] bg-card border-t border-border rounded-t-3xl shadow-2xl"
            style={{ height: '60vh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-5 pb-6 overflow-y-auto" style={{ height: 'calc(60vh - 56px)' }}>
              {/* Header row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{info?.emoji || (bar.type === 'landmark' ? '🏛️' : '🍺')}</span>
                    <h2 className="text-lg font-bold text-foreground leading-tight">{bar.name}</h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{bar.address}</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Info cards */}
              {info && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl bg-muted/50 border border-border p-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Vibe</p>
                    <p className="text-sm font-bold text-foreground">{info.vibe}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 border border-border p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Hours</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">{info.hours}</p>
                  </div>
                </div>
              )}

              {/* Type badge */}
              <div className="flex items-center gap-2 mb-5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  bar.type === 'landmark'
                    ? 'bg-red-500/10 text-red-600'
                    : 'bg-primary/10 text-primary'
                }`}>
                  <Star className="h-3 w-3" />
                  {bar.type === 'landmark' ? 'Wrigleyville Landmark' : 'Wrigleyville Bar'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full gap-2 rounded-xl min-h-[48px] text-sm font-bold"
                >
                  <a
                    href={getDirectionsUrl(bar.lat, bar.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="h-4 w-4" />
                    Get Walking Directions
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
