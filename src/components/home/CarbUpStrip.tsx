import { Link } from 'react-router-dom';
import { UtensilsCrossed, ChevronRight, Footprints, Star, Navigation } from 'lucide-react';
import { SectionHeader } from '@/components/SectionHeader';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface RestaurantCard {
  id: string;
  name: string;
  cuisine: string;
  walk: string;
  mustTry: string;
  rating: number;
  address: string;
  thumb: string; // ConceptIcon name
  accent: string; // gradient classes for the photo placeholder
}

const RESTAURANTS: RestaurantCard[] = [
  {
    id: 'crisp',
    name: 'Crisp',
    cuisine: 'Korean Fried Chicken',
    walk: '10 min walk',
    mustTry: 'Seoul Sassy Wings',
    rating: 4.8,
    address: '2940 N Broadway, Chicago, IL',
    thumb: 'food',
    accent: 'from-amber-500/40 via-orange-600/30 to-[hsl(var(--brand-red))]/40',
  },
  {
    id: 'big-star',
    name: 'Big Star',
    cuisine: 'Tacos & Whiskey',
    walk: '2 min walk',
    mustTry: 'Al Pastor Tacos',
    rating: 4.7,
    address: '3640 N Clark St, Chicago, IL',
    thumb: 'food',
    accent: 'from-rose-500/40 via-red-600/30 to-amber-500/30',
  },
  {
    id: 'smoke-daddy',
    name: 'Smoke Daddy',
    cuisine: 'BBQ',
    walk: '5 min walk',
    mustTry: 'Pulled Pork Sandwich',
    rating: 4.6,
    address: '3636 N Clark St, Chicago, IL',
    thumb: 'food',
    accent: 'from-orange-700/40 via-amber-600/30 to-yellow-500/30',
  },
  {
    id: 'wrigleyville-dogs',
    name: 'Wrigleyville Dogs',
    cuisine: 'Hot Dogs & Burgers',
    walk: '1 min walk',
    mustTry: 'Chicago Style Dog',
    rating: 4.5,
    address: '3737 N Clark St, Chicago, IL',
    thumb: 'hotdog',
    accent: 'from-yellow-500/40 via-red-500/30 to-emerald-600/30',
  },
];

function openDirections(address: string) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < full ? 'fill-secondary text-secondary' : 'text-white/30'}`}
          strokeWidth={2}
        />
      ))}
      <span className="ml-1 text-[11px] font-bold text-white">{rating.toFixed(1)}</span>
    </div>
  );
}

export function CarbUpStrip() {
  return (
    <section className="px-4 py-4">
      <SectionHeader
        icon={<UtensilsCrossed className="h-4 w-4" strokeWidth={2.4} />}
        title="Carb Up Before First Pitch"
        subtitle="Fuel up before the first pitch."
        onImage
        trailing={
          <Link
            to="/wrigleyville-eats"
            className="flex items-center gap-0.5 text-xs font-bold uppercase tracking-wider text-white/95 hover:text-white"
            style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.05em' }}
          >
            See All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="-mx-4 px-4 overflow-x-auto">
        <div className="flex gap-3 pb-2 snap-x snap-mandatory">
          {RESTAURANTS.map((r) => (
            <article
              key={r.id}
              className="snap-start shrink-0 w-[260px] rounded-2xl bg-[hsl(222,82%,18%)] overflow-hidden shadow-lg flex flex-col"
              style={{
                borderTop: '4px solid hsl(var(--brand-red))',
              }}
            >
              {/* Food photo placeholder */}
              <div className={`relative h-28 w-full bg-gradient-to-br ${r.accent} flex items-center justify-center`}>
                <ConceptIcon name={r.thumb} className="h-10 w-10 text-white/90 drop-shadow-md" />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,82%,18%)] via-transparent to-transparent" />
                <div className="absolute top-2 left-2">
                  <span
                    className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-white bg-[hsl(var(--brand-red))] px-2 py-1 rounded-full shadow"
                    style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.06em' }}
                  >
                    {r.cuisine}
                  </span>
                </div>
              </div>

              <div className="p-3 flex flex-col gap-2 flex-1">
                <h3
                  className="text-white text-base font-bold leading-tight"
                  style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.02em' }}
                >
                  {r.name}
                </h3>

                <div className="flex items-center gap-1.5 text-white/80 text-xs">
                  <Footprints className="h-3.5 w-3.5" strokeWidth={2.25} />
                  <span className="font-semibold">{r.walk}</span>
                </div>

                <div className="text-[11px] leading-snug">
                  <span className="font-bold uppercase tracking-wider text-[#ff5870]" style={{ letterSpacing: '0.05em' }}>
                    Must Try:
                  </span>{' '}
                  <span className="text-white/90 font-semibold">{r.mustTry}</span>
                </div>

                <StarRow rating={r.rating} />

                <button
                  type="button"
                  onClick={() => openDirections(r.address)}
                  className="mt-auto inline-flex items-center justify-center gap-1.5 w-full h-10 rounded-xl bg-[hsl(var(--brand-red))] text-white text-xs font-bold uppercase tracking-wider hover:bg-[hsl(var(--brand-red))] active:scale-[0.97] transition shadow-sm"
                  style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.05em' }}
                >
                  <Navigation className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Get Directions
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
