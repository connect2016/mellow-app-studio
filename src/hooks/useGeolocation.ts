import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Single source of truth for browser geolocation access.
 *
 * Rules:
 *   - Per-user permission stored at  geo_permission:${userId}
 *     (anonymous fallback key: geo_permission:anon).
 *   - The native browser prompt NEVER fires before our in-app modal.
 *     The modal calls `allow()` which then calls getCurrentPosition.
 *   - The hook itself NEVER writes raw GPS to Supabase. It only:
 *       (a) holds in-memory coords for the consumer,
 *       (b) reverse-geocodes to a zip via Nominatim (24h cached),
 *       (c) saves zip to profiles.zip_code.
 *   - Existing flows that write GPS to user_locations stay where they
 *     are — they just call `requestPosition()` instead of touching
 *     navigator.geolocation directly, so they can never bypass the gate.
 */

export type GeoPermission = 'granted' | 'declined' | null;

const PERM_KEY_PREFIX = 'geo_permission:';
const ZIP_CACHE_PREFIX = 'geo_zip_cache:'; // value: { zip, ts }
const ZIP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function permKey(userId: string | undefined | null) {
  return `${PERM_KEY_PREFIX}${userId || 'anon'}`;
}

export function getGeoPermission(userId: string | undefined | null): GeoPermission {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(permKey(userId));
    return v === 'granted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

export function setGeoPermission(userId: string | undefined | null, value: Exclude<GeoPermission, null>) {
  try {
    window.localStorage.setItem(permKey(userId), value);
    window.dispatchEvent(new CustomEvent('geo-permission-changed', { detail: { userId, value } }));
  } catch {
    // ignore
  }
}

export function clearGeoPermission(userId: string | undefined | null) {
  try {
    window.localStorage.removeItem(permKey(userId));
    window.dispatchEvent(new CustomEvent('geo-permission-changed', { detail: { userId, value: null } }));
  } catch {
    // ignore
  }
}

/** Reverse-geocode lat/lng to a US zip via Nominatim, with 24h cache. */
export async function reverseGeocodeZip(lat: number, lng: number): Promise<string | null> {
  const roundedKey = `${ZIP_CACHE_PREFIX}${lat.toFixed(2)},${lng.toFixed(2)}`;
  try {
    const cached = window.localStorage.getItem(roundedKey);
    if (cached) {
      const parsed = JSON.parse(cached) as { zip: string | null; ts: number };
      if (Date.now() - parsed.ts < ZIP_CACHE_TTL_MS) return parsed.zip;
    }
  } catch {
    // ignore parse errors
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`,
      { headers: { 'Accept-Language': 'en-US' } },
    );
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const data = await res.json();
    const raw = data?.address?.postcode as string | undefined;
    const zip = raw ? raw.match(/^\d{5}/)?.[0] ?? null : null;
    try {
      window.localStorage.setItem(roundedKey, JSON.stringify({ zip, ts: Date.now() }));
    } catch {
      // ignore
    }
    return zip;
  } catch {
    return null;
  }
}

interface PositionResult {
  lat: number;
  lng: number;
}

/**
 * Promise-style wrapper around getCurrentPosition that REQUIRES granted
 * permission. Throws if permission is not granted — callers should not
 * call this without first ensuring `permission === 'granted'`.
 */
function getCurrentPositionAsync(opts?: PositionOptions): Promise<PositionResult> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      opts ?? { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

interface UseGeolocationOptions {
  /** If true, automatically start watchPosition when granted. Default false. */
  watch?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { user } = useAuth();
  const userId = user?.id;
  const [permission, setPermissionState] = useState<GeoPermission>(() => getGeoPermission(userId));
  const [coords, setCoords] = useState<PositionResult | null>(null);
  const [zip, setZip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Re-read permission whenever the user changes or another tab/component updates it.
  useEffect(() => {
    setPermissionState(getGeoPermission(userId));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { userId?: string };
      if (!detail || detail.userId === userId) {
        setPermissionState(getGeoPermission(userId));
      }
    };
    window.addEventListener('geo-permission-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('geo-permission-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [userId]);

  // Watch position when granted + opted-in.
  useEffect(() => {
    if (!options.watch) return;
    if (permission !== 'granted') return;
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [permission, options.watch]);

  /**
   * Public: callers use this instead of navigator.geolocation directly.
   * - If granted → returns coords.
   * - If declined → throws (caller should fall back to zip).
   * - If null → opens the modal and throws — caller should treat as
   *   "user hasn't decided yet".
   */
  const requestPosition = useCallback(async (opts?: PositionOptions): Promise<PositionResult> => {
    const current = getGeoPermission(userId);
    if (current === 'granted') {
      const pos = await getCurrentPositionAsync(opts);
      setCoords(pos);
      return pos;
    }
    if (current === 'declined') {
      throw new Error('Location permission declined');
    }
    setShowModal(true);
    throw new Error('Location permission not yet granted');
  }, [userId]);

  /** Modal "Allow" handler — runs the native prompt, saves zip-only. */
  const allow = useCallback(async (): Promise<{ zip: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPositionAsync();
      setGeoPermission(userId, 'granted');
      setPermissionState('granted');
      setCoords(pos);
      const z = await reverseGeocodeZip(pos.lat, pos.lng);
      if (z) {
        setZip(z);
        if (userId) {
          try {
            await supabase.from('profiles').update({ zip_code: z }).eq('user_id', userId);
          } catch {
            // non-fatal
          }
        }
      }
      setShowModal(false);
      return { zip: z };
    } catch (e: any) {
      setError(e?.message ?? 'Could not get location');
      // If the OS denied the prompt, treat as declined so we don't loop.
      if (e?.code === 1) {
        setGeoPermission(userId, 'declined');
        setPermissionState('declined');
      }
      throw e;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /** Modal "Not now" handler — store zip manually instead. */
  const decline = useCallback(async (manualZip?: string) => {
    setGeoPermission(userId, 'declined');
    setPermissionState('declined');
    if (manualZip && /^\d{5}$/.test(manualZip)) {
      setZip(manualZip);
      if (userId) {
        try {
          await supabase.from('profiles').update({ zip_code: manualZip }).eq('user_id', userId);
        } catch {
          // non-fatal
        }
      }
    }
    setShowModal(false);
  }, [userId]);

  /** Settings: turn off entirely. */
  const stop = useCallback(() => {
    setGeoPermission(userId, 'declined');
    setPermissionState('declined');
    setCoords(null);
  }, [userId]);

  /** Settings: re-open modal. */
  const reopenModal = useCallback(() => {
    setShowModal(true);
  }, []);

  return {
    permission,
    coords,
    zip,
    loading,
    error,
    declined: permission === 'declined',
    showModal,
    setShowModal,
    requestPosition,
    allow,
    decline,
    stop,
    reopenModal,
  };
}
