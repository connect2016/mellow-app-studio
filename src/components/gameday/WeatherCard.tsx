import { useWrigleyWeather } from '@/hooks/useWrigleyWeather';
import { Wind, Droplets } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export function WeatherCard() {
  const { data: w, isLoading } = useWrigleyWeather();

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-2xl bg-muted/40" />;
  }
  if (!w) return null;

  const windCallout = w.windRelativeToField.startsWith('out')
    ? { label: 'Wind blowing out', color: 'text-emerald-600 dark:text-emerald-400', emoji: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />' }
    : w.windRelativeToField.startsWith('in')
    ? { label: 'Wind blowing in', color: 'text-blue-600 dark:text-blue-400', emoji: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />' }
    : { label: 'Cross-wind', color: 'text-muted-foreground', emoji: '〰️' };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Wrigley · Game Time
          </span>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${windCallout.color}`}>
          {windCallout.emoji} {windCallout.label} {w.windRelativeToField.replace(/^(out|in) /, '')}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-4">
        <div className="text-4xl">{w.emoji}</div>
        <div>
          <div className="font-display text-3xl font-extrabold leading-none text-foreground tabular-nums">
            {w.temperatureF}°
          </div>
          <div className="text-[11px] text-muted-foreground">
            Feels {w.apparentF}° · {w.weatherSummary}
          </div>
        </div>
        <div className="ml-auto grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wind className="h-3 w-3" />
            <span className="font-semibold text-foreground tabular-nums">{w.windMph}</span> mph {w.windDirection}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Droplets className="h-3 w-3" />
            <span className="font-semibold text-foreground tabular-nums">{w.precipitationProb}%</span> rain
          </div>
        </div>
      </div>
    </div>
  );
}
