import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { X, Navigation, Clock, MapPin, Star, Users, Utensils, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarCheckInButton } from '@/components/map/BarCheckInButton';
import { WhosHereNow } from '@/components/map/WhosHereNow';
import { useBarCheckins } from '@/hooks/useBarCheckins';
import { FOOD_SPOTS } from '@/lib/wrigleyville-eats';
import { CreateMeetupModal } from '@/components/lineup/CreateMeetupModal';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';
import { BuyBeerButton } from '@/components/beer/BuyBeerButton';

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
  "Murphy's Bleachers": { emoji: '', vibe: 'Classic Cubs bar', hours: 'Opens 2hrs before first pitch' },
  "The Cubby Bear Lounge Chicago": { emoji: '', vibe: 'Live music & sports', hours: '11AM – 2AM' },
  "Mordecai": { emoji: '', vibe: 'Craft cocktails', hours: '4PM – 12AM' },
  "Bernie's": { emoji: '', vibe: 'Party vibes', hours: '11AM – 2AM' },
  "GMAN Tavern": { emoji: '', vibe: 'Indie & chill', hours: '5PM – 2AM' },
};

export function BarDetailSheet({ bar, onClose }: Props) {
  const info = bar ? BAR_VIBES[bar.name] : null;
  const { visibleCheckins } = useBarCheckins(bar?.name);
  const fansListRef = useRef<HTMLDivElement | null>(null);
  const [showCreateMeetup, setShowCreateMeetup] = useState(false);

  // Find up to 3 nearest food spots within ~600m for recommendations
  const foodRecs = useMemo(() => {
    if (!bar) return [];
    const distKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const R = 6371;
      const toRad = (n: number) => (n * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(x));
    };
    return [...FOOD_SPOTS]
      .filter((s) => s.name !== bar.name)
      .map((s) => ({ ...s, _d: distKm(bar, s) }))
      .sort((a, b) => a._d - b._d)
      .slice(0, 3);
  }, [bar]);

  const scrollToFans = () => {
    fansListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <AnimatePresence>
      {bar && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/20"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[2001] bg-card border-t border-border rounded-t-3xl shadow-lg"
            style={{ height: '65vh' }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-5 pb-6 overflow-y-auto" style={{ height: 'calc(65vh - 56px)' }}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ConceptVisual name={info?.emoji || ''} size="sm" />
                    <h2 className="text-lg font-bold text-foreground leading-tight">{bar.name}</h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{bar.address}</span>
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                    <Users className="h-3 w-3" />
                    {visibleCheckins.length} {visibleCheckins.length === 1 ? 'Buddy' : 'Buddies'} here now
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Primary CTA: Meet Fans at This Bar */}
              <Button
                onClick={scrollToFans}
                className="w-full gap-2 rounded-xl min-h-[52px] text-sm font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              >
                <Users className="h-4 w-4" />
                Meet Fans at This Bar
                {visibleCheckins.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-[11px]">
                    {visibleCheckins.length}
                  </span>
                )}
              </Button>

              {/* Who's Here Now */}
              <div ref={fansListRef}>
                <WhosHereNow checkins={visibleCheckins} />
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

              {/* Checked-in count badge */}
              <div className="flex items-center gap-2 mb-5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  bar.type === 'landmark'
                    ? 'bg-red-500/10 text-red-600'
                    : 'bg-primary/10 text-primary'
                }`}>
                  <Star className="h-3 w-3" />
                  {bar.type === 'landmark' ? 'Wrigleyville Landmark' : 'Wrigleyville Bar'}
                </span>
                {visibleCheckins.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-accent/10 text-accent-foreground">
                    {visibleCheckins.length} checked in
                  </span>
                )}
              </div>

              {/* Food recommendations */}
              {foodRecs.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Utensils className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Eat Nearby</h3>
                  </div>
                  <div className="space-y-2">
                    {foodRecs.map((spot) => (
                      <div
                        key={spot.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3"
                      >
                        <span className="text-xl shrink-0"><ConceptVisual name={spot.emoji} size="sm" /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{spot.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {spot.vibe} · {spot.walkMinutes} min walk
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <BuyBeerButton
                  context={{ kind: 'bar', barName: bar.name }}
                  label={`Buy a Round at ${bar.name}`}
                  variant="default"
                  showMicrocopy
                  className="w-full rounded-xl min-h-[52px] text-sm"
                />
                <Button
                  onClick={() => setShowCreateMeetup(true)}
                  className="w-full gap-2 rounded-xl min-h-[52px] text-sm font-bold bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-secondary-foreground shadow-lg"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Start a Meetup Here
                </Button>
                {bar.type !== 'landmark' && (
                  <BarCheckInButton barName={bar.name} />
                )}
                <Button
                  asChild
                  variant={bar.type === 'landmark' ? 'default' : 'secondary'}
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
          <CreateMeetupModal
            open={showCreateMeetup}
            onClose={() => setShowCreateMeetup(false)}
            defaultLocation={bar.name}
          />
        </>
      )}
    </AnimatePresence>
  );
}
