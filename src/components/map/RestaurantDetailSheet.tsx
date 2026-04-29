import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Navigation, MapPin, Clock, Users, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FOOD_SPOTS, type FoodSpot, type GameDayPhase } from '@/lib/wrigleyville-eats';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface RestaurantInfo {
  /** Either pass a full FoodSpot id from the directory, or the raw fields below. */
  id?: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  emoji?: string;
  walkMinutes?: number;
  fanTip?: string;
}

interface Props {
  restaurant: RestaurantInfo | null;
  onClose: () => void;
}

function getDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}

const PHASE_LABEL: Record<GameDayPhase, { tag: string; emoji: string; gradient: string }> = {
  before: {
    tag: 'Fan Favorite for Pregame',
    emoji: '',
    gradient: 'from-amber-500/20 to-orange-500/5',
  },
  during: {
    tag: 'Top Carb-Up Spot',
    emoji: '',
    gradient: 'from-red-500/20 to-orange-500/5',
  },
  after: {
    tag: 'Best Postgame Meal',
    emoji: '',
    gradient: 'from-emerald-500/20 to-lime-500/5',
  },
};

/**
 * Choose which food-focused label to surface based on time of day.
 * Day games & pregame hours → Pregame
 * Late afternoon / typical first pitch window → Carb-Up
 * After 9pm → Postgame
 */
function pickPhase(): GameDayPhase {
  const hour = new Date().getHours();
  if (hour < 13) return 'before';
  if (hour < 21) return 'during';
  return 'after';
}

export function RestaurantDetailSheet({ restaurant, onClose }: Props) {
  const navigate = useNavigate();

  const spot: FoodSpot | undefined = useMemo(() => {
    if (!restaurant) return undefined;
    return (
      FOOD_SPOTS.find((s) => s.id === restaurant.id) ||
      FOOD_SPOTS.find((s) => s.name.toLowerCase() === restaurant.name.toLowerCase())
    );
  }, [restaurant]);

  const phase = pickPhase();
  const phaseMeta = PHASE_LABEL[phase];

  const description =
    spot?.gameDayHighlight?.[phase] ||
    restaurant?.fanTip ||
    spot?.fanTip ||
    'A Wrigleyville go-to that fans love before, during, and after the game.';

  const handleStartMeetup = () => {
    if (!restaurant) return;
    onClose();
    navigate(`/meetups?create=1&location=${encodeURIComponent(restaurant.name)}`);
  };

  return (
    <AnimatePresence>
      {restaurant && (
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
            className="fixed bottom-0 left-0 right-0 z-[2001] bg-card border-t border-border rounded-t-3xl shadow-2xl"
            style={{ height: '60vh' }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-5 pb-6 overflow-y-auto" style={{ height: 'calc(60vh - 56px)' }}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ConceptIcon name={spot?.emoji || restaurant.emoji || ''} className="h-6 w-6" />
                    <h2 className="text-lg font-bold text-foreground leading-tight">
                      {restaurant.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{restaurant.address}</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Phase-aware food label card */}
              <div
                className={`mb-4 rounded-2xl border border-border bg-gradient-to-br ${phaseMeta.gradient} p-4`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg"><ConceptIcon name={phaseMeta.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
                    {phaseMeta.tag}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">{description}</p>
              </div>

              {/* Quick facts */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl bg-muted/50 border border-border p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Walk from Wrigley
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {spot?.walkMinutes ?? restaurant.walkMinutes ?? '—'} min
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 border border-border p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Vibe
                  </p>
                  <p className="text-sm font-bold text-foreground">{spot?.vibe || 'Casual'}</p>
                </div>
              </div>

              {/* Primary CTA: start a meetup here */}
              <Button
                onClick={handleStartMeetup}
                className="w-full gap-2 rounded-xl min-h-[52px] text-sm font-bold mb-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              >
                <Users className="h-4 w-4" />
                Start a Meetup Here
              </Button>

              {/* Secondary: directions */}
              <Button
                asChild
                variant="secondary"
                className="w-full gap-2 rounded-xl min-h-[48px] text-sm font-bold"
              >
                <a
                  href={getDirectionsUrl(restaurant.lat, restaurant.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="h-4 w-4" />
                  Get Walking Directions
                </a>
              </Button>

              {/* Footer tag */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <Utensils className="h-3 w-3" />
                Wrigleyville Eats
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
