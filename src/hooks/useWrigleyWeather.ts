import { useQuery } from '@tanstack/react-query';

// Open-Meteo — no API key required.
// Wrigley Field: 41.9484, -87.6553
const WRIGLEY_LAT = 41.9484;
const WRIGLEY_LNG = -87.6553;

export interface WrigleyWeather {
  temperatureF: number;
  apparentF: number;
  windMph: number;
  windDirectionDeg: number;
  windDirection: string;        // N, NE, E, ...
  windRelativeToField: 'out to LF' | 'out to CF' | 'out to RF' | 'in from LF' | 'in from CF' | 'in from RF' | 'cross-wind';
  precipitationProb: number;    // %
  weatherCode: number;
  weatherSummary: string;       // human readable
  isDay: boolean;
  emoji: string;
}

function degToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

// Wrigley Field's home plate points roughly NE (~45° from N).
// Wind blowing FROM the SW (~225°) goes OUT toward CF.
function classifyWindForField(degFrom: number): WrigleyWeather['windRelativeToField'] {
  // Open-Meteo wind_direction is the direction wind is coming FROM.
  const d = (degFrom + 360) % 360;
  // Out to LF: wind from ~SE (135°) ±30
  // Out to CF: wind from ~SW (225°) ±30
  // Out to RF: wind from ~W  (270°) ±30
  // In from LF: wind from ~NW (315°) ±30
  // In from CF: wind from ~NE (45°)  ±30
  // In from RF: wind from ~E  (90°)  ±30
  if (d >= 195 && d < 255) return 'out to CF';
  if (d >= 105 && d < 165) return 'out to LF';
  if (d >= 255 && d < 300) return 'out to RF';
  if (d >= 300 && d < 345) return 'in from LF';
  if (d >= 15 && d < 75) return 'in from CF';
  if (d >= 75 && d < 105) return 'in from RF';
  return 'cross-wind';
}

function summarizeCode(code: number, isDay: boolean): { summary: string; emoji: string } {
  // Open-Meteo WMO weather codes
  if (code === 0) return { summary: 'Clear', emoji: isDay ? '☀️' : '🌙' };
  if (code <= 3) return { summary: code === 1 ? 'Mainly clear' : code === 2 ? 'Partly cloudy' : 'Overcast', emoji: '⛅' };
  if (code <= 48) return { summary: 'Foggy', emoji: '🌫️' };
  if (code <= 57) return { summary: 'Drizzle', emoji: '🌦️' };
  if (code <= 67) return { summary: 'Rain', emoji: '🌧️' };
  if (code <= 77) return { summary: 'Snow', emoji: '🌨️' };
  if (code <= 82) return { summary: 'Rain showers', emoji: '🌧️' };
  if (code <= 86) return { summary: 'Snow showers', emoji: '🌨️' };
  if (code <= 99) return { summary: 'Thunderstorm', emoji: '⛈️' };
  return { summary: '—', emoji: '🌡️' };
}

export function useWrigleyWeather() {
  return useQuery<WrigleyWeather | null>({
    queryKey: ['wrigley-weather'],
    queryFn: async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${WRIGLEY_LAT}&longitude=${WRIGLEY_LNG}&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`weather ${res.status}`);
        const json = await res.json();
        const c = json?.current;
        if (!c) return null;
        const dirDeg = c.wind_direction_10m ?? 0;
        const code = c.weather_code ?? 0;
        const isDay = c.is_day === 1;
        const { summary, emoji } = summarizeCode(code, isDay);
        return {
          temperatureF: Math.round(c.temperature_2m),
          apparentF: Math.round(c.apparent_temperature),
          windMph: Math.round(c.wind_speed_10m),
          windDirectionDeg: dirDeg,
          windDirection: degToCompass(dirDeg),
          windRelativeToField: classifyWindForField(dirDeg),
          precipitationProb: Math.round(c.precipitation_probability ?? 0),
          weatherCode: code,
          weatherSummary: summary,
          isDay,
          emoji,
        };
      } catch (err) {
        console.error('[useWrigleyWeather] failed', err);
        return null;
      }
    },
    refetchInterval: 10 * 60 * 1000, // 10 min
    staleTime: 5 * 60 * 1000,
  });
}
