import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Footprints, Flame, Star, Beer, Users, type LucideIcon } from 'lucide-react';

type Card = {
  to: string;
  icon: LucideIcon;
  title: string;
  copy: string;
  gradient: string;
  iconTint: string;
};

const CARDS: Card[] = [
  {
    to: '/discover',
    icon: Sparkles,
    title: 'New Buddies Nearby',
    copy: 'Just popped up near you — say hi before first pitch.',
    gradient: 'linear-gradient(135deg, #0E3386 0%, #2B5FBF 100%)',
    iconTint: '#FDB827',
  },
  {
    to: '/buddy-heatmap',
    icon: Footprints,
    title: 'Walking to Wrigley',
    copy: 'Fans are heading to the ballpark right now. Join the flow.',
    gradient: 'linear-gradient(135deg, #CC3433 0%, #E85D2A 100%)',
    iconTint: '#FFFFFF',
  },
  {
    to: '/meetups',
    icon: Flame,
    title: 'Meetups Heating Up',
    copy: 'Jump in before they fill — spots going fast.',
    gradient: 'linear-gradient(135deg, #E85D2A 0%, #F2A341 100%)',
    iconTint: '#FFFFFF',
  },
  {
    to: '/discover',
    icon: Star,
    title: 'Top Fans Tonight',
    copy: 'Matched on your vibe + location for the night.',
    gradient: 'linear-gradient(135deg, #6A1B9A 0%, #C8102E 100%)',
    iconTint: '#FDB827',
  },
  {
    to: '/bar-map',
    icon: Beer,
    title: 'Buzzing Bar Spots',
    copy: 'These spots are packed with friendly fans right now.',
    gradient: 'linear-gradient(135deg, #1B5E20 0%, #43A047 100%)',
    iconTint: '#FDB827',
  },
];

export function HomeQuickCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const next = (indexRef.current + 1) % CARDS.length;
      indexRef.current = next;
      const card = el.children[next] as HTMLElement | undefined;
      if (card) {
        el.scrollTo({ left: card.offsetLeft - 16, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div className="mb-3">
      <div
        ref={scrollerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        className="flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {CARDS.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link
              key={i}
              to={c.to}
              className="snap-start shrink-0 rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-white/20 active:scale-[0.98] transition-transform duration-150"
              style={{
                width: '280px',
                height: '140px',
                background: c.gradient,
              }}
            >
              <div className="flex h-full w-full flex-col justify-between p-4 text-white">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-sm"
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.5} style={{ color: c.iconTint }} />
                  </div>
                  <p
                    className="text-[13px] font-bold uppercase tracking-wide"
                    style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.5px' }}
                  >
                    {c.title}
                  </p>
                </div>
                <p className="text-[13px] font-medium leading-snug text-white/95">
                  {c.copy}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
