import { useWrigleyWeather, type WrigleyWeather } from '@/hooks/useWrigleyWeather';
import {
  Wind,
  Droplets,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  CloudDrizzle,
  Navigation,
  ArrowRight,
  ArrowLeftRight,
} from 'lucide-react';

/**
 * Pick the best Lucide weather icon for a WMO weather code.
 */
function getWeatherIcon(code: number, isDay: boolean) {
  if (code === 0) return isDay ? Sun : Moon;
  if (code <= 3) return Cloud;
  if (code <= 48) return CloudFog;
  if (code <= 57) return CloudDrizzle;
  if (code <= 67) return CloudRain;
  if (code <= 77) return CloudSnow;
  if (code <= 82) return CloudRain;
  if (code <= 86) return CloudSnow;
  if (code <= 99) return CloudLightning;
  return Cloud;
}

/**
 * Wind callout with a directional arrow icon.
 * "Out" = blowing away from home plate, "In" = blowing toward.
 */
function WindCallout({ w }: { w: WrigleyWeather }) {
  const isOut = w.windRelativeToField.startsWith('out');
  const isIn = w.windRelativeToField.startsWith('in');

  const config = isOut
    ? { label: 'Wind blowing out', color: 'text-emerald-600 dark:text-emerald-400', Icon: ArrowRight }
    : isIn
    ? { label: 'Wind blowing in', color: 'text-blue-600 dark:text-blue-400', Icon: ArrowRight }
    : { label: 'Cross-wind', color: 'text-muted-foreground', Icon: ArrowLeftRight };

  const { Icon } = config;
  const arrowRotation = isIn ? 180 : 0;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
      <Icon
        className="h-3 w-3"
        strokeWidth={2.4}
        style={isIn || isOut ? { transform: `rotate(${arrowRotation}deg)` } : undefined}
      />
      {config.label} {w.windRelativeToField.replace(/^(out|in) /, '')}
    </span>
  );
}

export function WeatherCard() {
  const { data: w, isLoading } = useWrigleyWeather();

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-2xl bg-muted/40" />;
  }
  if (!w) return null;

  const WeatherIcon = getWeatherIcon(w.weatherCode, w.isDay);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Wrigley · Game Time
        </span>
        <WindCallout w={w} />
      </div>

      <div className="mt-2 flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <WeatherIcon className="h-7 w-7" strokeWidth={2} />
        </span>
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
            <span className="font-semibold text-foreground tabular-nums">{w.windMph}</span> mph
            <Navigation
              className="h-3 w-3 text-muted-foreground"
              strokeWidth={2.2}
              style={{ transform: `rotate(${(w.windDirectionDeg + 180) % 360}deg)` }}
              aria-label={`Wind direction ${w.windDirection}`}
            />
            <span className="text-foreground/80">{w.windDirection}</span>
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
