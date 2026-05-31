import { useQuery } from '@tanstack/react-query';
import { Sun, Cloud, CloudRain, Wind } from 'lucide-react';
import { useMlbCubsGame } from '@/hooks/useMlbCubsGame';

const WRIGLEY_LAT = 41.9484;
const WRIGLEY_LNG = -87.6553;

interface WeatherData {
  temperatureF: number;
  windMph: number;
  windDirDeg: number;
  windDirCompass: string;
  precipProb: number;
  weatherCode: number;
}

function degToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

// Open-Meteo wind_direction = direction wind is coming FROM.
// Wrigley home plate points NE; wind from SW (~225°) blows OUT to CF.
function windRelativeToField(degFrom: number): 'out' | 'in' | 'cross' {
  const d = (degFrom + 360) % 360;
  if (d >= 105 && d < 300) return 'out';
  if ((d >= 300 && d < 360) || (d >= 0 && d < 105)) return 'in';
  return 'cross';
}

function pickCondition(w: WeatherData): {
  label: 'sunny' | 'cloudy' | 'rainy' | 'windy';
  Icon: typeof Sun;
  emoji: string;
} {
  if (w.precipProb >= 50 || (w.weatherCode >= 51 && w.weatherCode <= 99)) {
    return { label: 'rainy', Icon: CloudRain, emoji: '🌧️' };
  }
  if (w.windMph >= 18) return { label: 'windy', Icon: Wind, emoji: '💨' };
  if (w.weatherCode === 0 || w.weatherCode === 1) {
    return { label: 'sunny', Icon: Sun, emoji: '☀️' };
  }
  return { label: 'cloudy', Icon: Cloud, emoji: '⛅' };
}

function gameImpactNote(w: WeatherData): string {
  if (w.precipProb >= 50) return 'Rain possible — grab a poncho 🌧️';
  const rel = windRelativeToField(w.windDirDeg);
  if (rel === 'out' && w.windMph >= 8) return 'Wind blowing out — home run weather! 💨⚾';
  if (rel === 'in' && w.windMph >= 8) return "Wind blowing in — pitcher's park tonight 🎯";
  return 'Clear skies over Wrigley — play ball! ⚾';
}

function useGameDayWeather() {
  return useQuery<WeatherData | null>({
    queryKey: ['gameday-weather', WRIGLEY_LAT, WRIGLEY_LNG],
    queryFn: async () => {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${WRIGLEY_LAT}&longitude=${WRIGLEY_LNG}` +
        `&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`weather ${res.status}`);
      const json = await res.json();
      const c = json?.current;
      if (!c) return null;
      const deg = c.wind_direction_10m ?? 0;
      return {
        temperatureF: Math.round(c.temperature_2m ?? 0),
        windMph: Math.round(c.wind_speed_10m ?? 0),
        windDirDeg: deg,
        windDirCompass: degToCompass(deg),
        precipProb: Math.round(c.precipitation_probability ?? 0),
        weatherCode: c.weather_code ?? 0,
      };
    },
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    staleTime: 30 * 60 * 1000,
  });
}

export function GameDayWeatherCard() {
  const { data: game } = useMlbCubsGame();
  const { data: weather } = useGameDayWeather();

  // Game-day only
  if (!game || game.status === 'no-game' || game.status === 'postponed' || game.status === 'final') {
    return null;
  }
  if (!weather) return null;

  const condition = pickCondition(weather);
  const note = gameImpactNote(weather);

  return (
    <section
      aria-label="Wrigley Field weather"
      className="mx-3 mb-2 flex items-center gap-3 rounded-xl border-l-4 px-3 py-2.5 shadow-md"
      style={{
        background: 'hsl(220, 75%, 18%)', // Cubs navy
        borderLeftColor: 'hsl(0, 70%, 45%)', // Cubs red accent
      }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
        <condition.Icon className="h-5 w-5 text-yellow-200" strokeWidth={2.25} aria-hidden />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className="text-xl font-extrabold leading-none text-white"
            style={{ fontFamily: 'Norwester, sans-serif' }}
          >
            {weather.temperatureF}°F
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-yellow-200">
            <Wind className="h-3 w-3" aria-hidden />
            {weather.windMph} mph {weather.windDirCompass}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px] font-semibold text-white/90">
          {note}
        </p>
      </div>

      <span className="sr-only">Condition: {condition.label}</span>
    </section>
  );
}
