import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';

export function FindFansBanner() {
  return (
    <Link
      to="/discover"
      aria-label="Find Fellow Fans Near You"
      className="group block mx-4 mt-3 mb-2 rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(204,52,51,0.25)] ring-1 ring-white/30 active:scale-[0.99] transition-transform duration-150"
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--brand-red)) 0%, #E85D2A 55%, #F2A341 100%)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3 min-h-[64px]">
        <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/40 backdrop-blur-sm">
          <Users className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0 text-white">
          <p
            className="text-[14px] sm:text-[15px] font-bold leading-tight uppercase tracking-wide truncate"
            style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.5px' }}
          >
            Find Fellow Fans Near You
          </p>
          <p className="text-[12px] sm:text-[13px] font-medium leading-snug text-white/95 mt-0.5">
            Your Wrigleyville crew is closer than you think.
          </p>
        </div>
        <ChevronRight
          className="h-5 w-5 text-white/90 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          strokeWidth={2.5}
        />
      </div>
    </Link>
  );
}
