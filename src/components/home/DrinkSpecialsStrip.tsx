import { Link } from 'react-router-dom';
import { Beer } from 'lucide-react';

interface Special {
  bar: string;
  deal: string;
  emoji: string;
  accent: string;
}

const SPECIALS: Special[] = [
  { bar: "Murphy's Bleachers", deal: '$5 Old Style cans', emoji: '', accent: 'from-amber-400 to-amber-600' },
  { bar: 'Cubby Bear', deal: '2-for-1 well drinks', emoji: '', accent: 'from-orange-400 to-red-500' },
  { bar: "Bernie's", deal: '$3 game-day shots', emoji: '', accent: 'from-rose-400 to-pink-600' },
  { bar: 'Sluggers', deal: '$15 buckets', emoji: '', accent: 'from-blue-500 to-indigo-600' },
  { bar: 'Gallagher Way', deal: 'Live music + $6 IPAs', emoji: '', accent: 'from-emerald-500 to-teal-600' },
];

export function DrinkSpecialsStrip() {
  return (
    <section aria-labelledby="drink-specials-heading" className="mb-5">
      <div className="flex items-baseline justify-between mb-1 px-1">
        <h2 id="drink-specials-heading" className="text-lg font-bold text-destructive-foreground text-on-image flex items-center gap-1.5">
          <Beer className="h-4 w-4 text-amber-400" /> Tonight's Drink Specials
        </h2>
      </div>
      <p className="text-[11px] text-on-image-muted px-1 mb-2.5 italic">
        Sample specials — partner bars coming soon
      </p>

      <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-none snap-x snap-mandatory">
        {SPECIALS.map((s) => (
          <Link
            key={s.bar}
            to="/bar-map"
            className="snap-start shrink-0 w-[60%] sm:w-[42%] rounded-2xl overflow-hidden shadow-sm border border-border transition active:scale-[0.97] hover:shadow-md"
          >
            <div className={`h-20 bg-gradient-to-br ${s.accent} flex items-center justify-center text-4xl`}>
              {s.emoji}
            </div>
            <div className="bg-card p-3">
              <p className="text-xs line-clamp-2 mt-1 text-destructive-foreground">
                {s.bar}
              </p>
              <p className="text-base font-bold leading-tight mt-2 text-destructive-foreground">
                {s.deal}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
