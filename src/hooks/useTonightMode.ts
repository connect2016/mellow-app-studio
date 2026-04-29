import { useEffect, useState } from 'react';

const WRIGLEY_LAT = 41.9484;
const WRIGLEY_LNG = -87.6553;
const RADIUS_KM = 1.5; // ~1mi Wrigleyville radius

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

interface Options {
  isGameDay?: boolean;
}

/**
 * Tonight Mode auto-activates when:
 *  - It's after 4pm local time on a game day, OR
 *  - The user is within the Wrigleyville radius
 * Users can manually toggle, persisted in localStorage for the rest of the day.
 */
export function useTonightMode({ isGameDay = false }: Options = {}) {
  const todayKey = `tonight-mode:${new Date().toDateString()}`;

  const [override, setOverride] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(todayKey);
    return stored === null ? null : stored === '1';
  });

  const [nearWrigley, setNearWrigley] = useState(false);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, WRIGLEY_LAT, WRIGLEY_LNG);
        setNearWrigley(km <= RADIUS_KM);
      },
      () => {},
      { maximumAge: 5 * 60 * 1000, timeout: 8000 }
    );
    return () => { cancelled = true; };
  }, []);

  const afterFourGameDay = isGameDay && new Date().getHours() >= 16;
  const autoActive = afterFourGameDay || nearWrigley;
  const active = override ?? autoActive;

  const setActive = (val: boolean) => {
    setOverride(val);
    try { window.localStorage.setItem(todayKey, val ? '1' : '0'); } catch {}
  };

  const reset = () => {
    setOverride(null);
    try { window.localStorage.removeItem(todayKey); } catch {}
  };

  return { active, setActive, reset, autoActive, nearWrigley, afterFourGameDay };
}
