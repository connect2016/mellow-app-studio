import { Link } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { useVenueActivity } from '@/hooks/useVenueActivity';

export function MapPreviewCard() {
  const { data: venues = [] } = useVenueActivity();
  const activeCount = venues.filter((v) => v.totalUsers > 0).length;
  const totalFans = venues.reduce((s, v) => s + v.totalUsers, 0);

  return (
    <Link
      to="/bar-map"
      aria-label="Open Wrigleyville bar map"
      className="block mb-5 rounded-2xl overflow-hidden border border-border bg-card shadow-sm transition active:scale-[0.99] hover:shadow-md"
    >
      <div className="relative h-32 bg-[linear-gradient(135deg,#0E3386_0%,#1a4cb8_45%,#3b6dd8_100%)]">
        {/* Stylized Wrigleyville street grid */}
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 320 128"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line x1="0" y1="40" x2="320" y2="40" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="72" x2="320" y2="72" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="320" y2="100" stroke="white" strokeWidth="0.5" />
          <line x1="80" y1="0" x2="80" y2="128" stroke="white" strokeWidth="0.5" />
          <line x1="160" y1="0" x2="160" y2="128" stroke="white" strokeWidth="0.5" />
          <line x1="240" y1="0" x2="240" y2="128" stroke="white" strokeWidth="0.5" />
        </svg>

        {/* Wrigley Field marker */}
        <div className="absolute" style={{ top: '38%', left: '46%' }}>
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50" />
            <div className="relative h-7 w-7 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-sm">
              🏟️
            </div>
          </div>
        </div>

        {/* Bar pins */}
        {[
          { top: '22%', left: '28%' },
          { top: '60%', left: '32%' },
          { top: '28%', left: '68%' },
          { top: '70%', left: '62%' },
          { top: '50%', left: '78%' },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute h-3 w-3 rounded-full bg-amber-400 border border-white shadow"
            style={p}
          />
        ))}

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider">
            <MapPin className="h-3 w-3" /> Wrigleyville
          </span>
          {totalFans > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-white/95 text-[11px] font-bold text-foreground shadow">
              {totalFans} fans · {activeCount} bars live
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-card">
        <div>
          <p className="text-base font-bold leading-tight mt-2 text-destructive-foreground">Open the live bar map</p>
          <p className="text-xs text-muted-foreground mt-0.5">See who's where, plan your night</p>
        </div>
        <ChevronRight className="h-5 w-5 text-primary" />
      </div>
    </Link>
  );
}
