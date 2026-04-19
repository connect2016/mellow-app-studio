import { MapPin } from 'lucide-react';
import type { ParticipatingBar } from '@/lib/wrigleyville-bar-coords';

interface Props {
  bar: ParticipatingBar;
}

function getEmbedSrc(bar: ParticipatingBar) {
  const delta = 0.0035;
  const left = bar.lng - delta;
  const right = bar.lng + delta;
  const top = bar.lat + delta;
  const bottom = bar.lat - delta;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${bar.lat}%2C${bar.lng}`;
}

export function BarLocationPreview({ bar }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative h-32 w-full overflow-hidden bg-muted">
        <iframe
          title={`Map preview for ${bar.name}`}
          src={getEmbedSrc(bar)}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
          🍺
        </div>
      </div>
      <div className="flex items-start gap-2 p-2.5">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-foreground">{bar.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{bar.address}</p>
        </div>
      </div>
    </div>
  );
}
