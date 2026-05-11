import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, ArrowRight } from 'lucide-react';
import { useVenueActivity } from '@/hooks/useVenueActivity';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const PREVIEW_BARS = [
  { name: "Murphy's Bleachers", top: '22%', left: '24%', delay: '0s' },
  { name: 'Cubby Bear', top: '58%', left: '52%', delay: '0.4s' },
  { name: "Bernie's", top: '34%', left: '76%', delay: '0.8s' },
];

export function MapPreviewCard() {
  const { data: venues = [] } = useVenueActivity();
  const activeCount = venues.filter((v) => v.totalUsers > 0).length;
  const totalFans = venues.reduce((s, v) => s + v.totalUsers, 0);

  return (
    <section
      aria-labelledby="bar-map-preview-heading"
      className="mb-5 overflow-hidden rounded-2xl border-2 border-secondary/40 bg-gradient-to-br from-primary via-primary to-[hsl(222,82%,22%)] shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/20 ring-2 ring-secondary/40">
          <ConceptIcon name="map" className="h-5 w-5 text-secondary" />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            id="bar-map-preview-heading"
            className="text-base font-extrabold leading-tight text-white"
            style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.02em' }}
          >
            See Where the Crew Is Tonight
          </h3>
          <p className="mt-1 text-sm font-medium text-white/85">
            Check in at a bar and appear on the live map.
          </p>
        </div>
      </div>

      {/* Mini map */}
      <div className="relative mx-4 h-36 overflow-hidden rounded-xl border border-secondary/30 bg-[linear-gradient(135deg,hsl(222,82%,18%)_0%,hsl(222,82%,29%)_55%,hsl(222,72%,38%)_100%)]">
        {/* Street grid */}
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          viewBox="0 0 320 144"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line x1="0" y1="40" x2="320" y2="40" stroke="white" strokeWidth="0.6" />
          <line x1="0" y1="84" x2="320" y2="84" stroke="white" strokeWidth="0.6" />
          <line x1="0" y1="118" x2="320" y2="118" stroke="white" strokeWidth="0.6" />
          <line x1="80" y1="0" x2="80" y2="144" stroke="white" strokeWidth="0.6" />
          <line x1="160" y1="0" x2="160" y2="144" stroke="white" strokeWidth="0.6" />
          <line x1="240" y1="0" x2="240" y2="144" stroke="white" strokeWidth="0.6" />
        </svg>

        {/* Live status chip */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
          </span>
          Live · Wrigleyville
        </div>
        {totalFans > 0 && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-primary shadow">
            {totalFans} fans · {activeCount} bars
          </span>
        )}

        {/* Bar pins with labels */}
        {PREVIEW_BARS.map((bar, i) => (
          <div
            key={bar.name}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: bar.top, left: bar.left }}
          >
            <div className="relative flex flex-col items-center">
              <span className="relative flex h-4 w-4">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-70"
                  style={{ animationDelay: bar.delay }}
                />
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-secondary shadow-md" />
              </span>
              <span
                className="mt-1 whitespace-nowrap rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white shadow backdrop-blur-sm"
                style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.03em' }}
              >
                {bar.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4 pt-4">
        <Link
          to="/bar-map"
          aria-label="Open the live bar map"
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-base font-extrabold text-secondary-foreground shadow-md transition-all duration-150 active:scale-[0.98] hover:bg-secondary/90"
          style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.03em' }}
        >
          <MapPin className="h-5 w-5" strokeWidth={2.6} />
          Open the Live Bar Map
          <ArrowRight className="h-5 w-5" strokeWidth={2.6} />
        </Link>
      </div>
    </section>
  );
}
