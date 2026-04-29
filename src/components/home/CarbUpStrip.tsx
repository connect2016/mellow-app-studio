import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Pizza, ChevronRight, MapPin } from 'lucide-react';
import { FOOD_SPOTS } from '@/lib/wrigleyville-eats';

const SUBCOPY = [
  'Hydration is important. So is pizza.',
  'Carb-loading: not just for marathon runners.',
  'Beer tastes better after a burrito. Science probably agrees.',
  "It's a day game. You're gonna need fries.",
];

// Each card pins a humorous label to a spot id (with a fallback tag-based pick).
const PICKS: { label: string; emoji: string; matchId: string; fallbackTag: string; gradient: string }[] = [
  { label: 'Elite pre-beer fuel', emoji: '', matchId: 'crisp-wrigleyville', fallbackTag: 'pizza', gradient: 'from-amber-500/20 to-orange-500/10' },
  { label: 'Top recovery tacos', emoji: '', matchId: 'big-star', fallbackTag: 'tacos', gradient: 'from-rose-500/20 to-red-500/10' },
  { label: 'Postgame sandwich heaven', emoji: '', matchId: 'small-cheval', fallbackTag: 'burgers', gradient: 'from-emerald-500/20 to-lime-500/10' },
];

export function CarbUpStrip() {
  const subcopy = useMemo(() => SUBCOPY[Math.floor(Math.random() * SUBCOPY.length)], []);

  const cards = useMemo(() => {
    return PICKS.map((p) => {
      const spot =
        FOOD_SPOTS.find((s) => s.id === p.matchId) ||
        FOOD_SPOTS.find((s) => s.tags.includes(p.fallbackTag as never)) ||
        FOOD_SPOTS[0];
      return { ...p, spot };
    });
  }, []);

  return (
    <section className="px-4 py-4">
      <div className="flex items-end justify-between mb-1 text-destructive-foreground">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-primary-foreground" style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.5px' }}>
            <Pizza className="h-5 w-5 text-orange-500" />
            CARB UP BEFORE FIRST PITCH
          </h2>
          <p className="text-xs italic mt-0.5 text-destructive-foreground">{subcopy}</p>
        </div>
        <Link to="/wrigleyville-eats" className="flex items-center text-xs font-semibold text-primary hover:underline shrink-0 ml-2">
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="-mx-4 px-4 overflow-x-auto">
        <div className="flex gap-3 pb-2 snap-x snap-mandatory">
          {cards.map(({ label, emoji, gradient, spot }) => (
            <Link
              key={label}
              to="/wrigleyville-eats"
              className={`snap-start shrink-0 w-[240px] min-h-[140px] rounded-2xl border border-border bg-gradient-to-br ${gradient} p-4 flex flex-col justify-between hover:border-primary/40 transition-colors`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl leading-none">{emoji}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 bg-card/70 backdrop-blur px-2 py-0.5 rounded-full">
                    {label}
                  </span>
                </div>
                <p className="text-base font-bold leading-tight mt-2 text-destructive-foreground">{spot.name}</p>
                <p className="text-xs line-clamp-2 mt-1 text-destructive-foreground">{spot.fanTip}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground/70">
                <MapPin className="h-3 w-3" />
                {spot.walkMinutes} min walk
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
