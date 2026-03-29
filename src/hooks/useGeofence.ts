import { useState, useEffect } from 'react';

// Wrigley Field coordinates
const WRIGLEY_LAT = 41.9484;
const WRIGLEY_LNG = -87.6553;
const MAX_DISTANCE_MILES = 0.5;

function getDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGeofence() {
  const [nearWrigley, setNearWrigley] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkLocation = () => {
    if (!navigator.geolocation) {
      setNearWrigley(false);
      return;
    }
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = getDistanceMiles(pos.coords.latitude, pos.coords.longitude, WRIGLEY_LAT, WRIGLEY_LNG);
        setNearWrigley(dist <= MAX_DISTANCE_MILES);
        setChecking(false);
      },
      () => {
        setNearWrigley(false);
        setChecking(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    checkLocation();
  }, []);

  return { nearWrigley, checking, recheckLocation: checkLocation };
}
