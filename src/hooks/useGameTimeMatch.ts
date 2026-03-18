import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useCallback } from 'react';

// Wrigley Field coordinates
const WRIGLEY_LAT = 41.9484;
const WRIGLEY_LNG = -87.6553;
const PROXIMITY_METERS = 500;

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Is point within 500m of Wrigley? */
export function isNearWrigley(lat: number, lng: number): boolean {
  return haversineDistance(lat, lng, WRIGLEY_LAT, WRIGLEY_LNG) <= PROXIMITY_METERS;
}

/** Is there a live home game right now? */
export function useActiveGame() {
  return useQuery({
    queryKey: ['active-game'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_home', true)
        .lte('game_start', now)
        .gte('game_end', now)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });
}

/** Push the user's geolocation to user_locations table */
export function useGeoUpdater() {
  const { user } = useAuth();

  const updateLocation = useCallback(async () => {
    if (!user || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Upsert
        const { error } = await supabase
          .from('user_locations')
          .upsert(
            { user_id: user.id, latitude, longitude, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );
        if (error) console.error('Geo update failed:', error);
      },
      (err) => console.warn('Geolocation error:', err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [user]);

  // Update every 2 minutes when on Discover
  useEffect(() => {
    updateLocation();
    const interval = setInterval(updateLocation, 120000);
    return () => clearInterval(interval);
  }, [updateLocation]);

  return updateLocation;
}

/** Check if other user is near Wrigley */
async function isUserNearWrigley(userId: string): Promise<boolean> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('user_locations')
    .select('latitude, longitude')
    .eq('user_id', userId)
    .gte('updated_at', fiveMinAgo)
    .maybeSingle();

  if (!data) return false;
  return isNearWrigley(data.latitude, data.longitude);
}

/** Try to create a game-time match after a mutual like during a live game */
export function useGameTimeMatchTrigger() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      otherUserId,
      gameId,
    }: {
      otherUserId: string;
      gameId: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // 1. Check if current user is near Wrigley
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: myLoc } = await supabase
        .from('user_locations')
        .select('latitude, longitude')
        .eq('user_id', user.id)
        .gte('updated_at', fiveMinAgo)
        .maybeSingle();

      if (!myLoc || !isNearWrigley(myLoc.latitude, myLoc.longitude)) {
        return null; // Not at Wrigley
      }

      // 2. Check if other user is near Wrigley
      const otherNear = await isUserNearWrigley(otherUserId);
      if (!otherNear) return null;

      // 3. Both at Wrigley during a game! Create game-time match
      const userA = user.id < otherUserId ? user.id : otherUserId;
      const userB = user.id < otherUserId ? otherUserId : user.id;

      // Create a conversation for the timed chat
      const { data: conv } = await supabase
        .from('conversations')
        .insert({ participant_a: userA, participant_b: userB })
        .select('id')
        .single();

      const { data: gtm, error } = await supabase
        .from('game_time_matches')
        .insert({
          user_a: userA,
          user_b: userB,
          game_id: gameId,
          conversation_id: conv?.id ?? null,
          meeting_spot: 'Captain Morgan Club',
        })
        .select()
        .single();

      if (error) {
        // Duplicate — already matched for this game
        if (error.message?.includes('duplicate') || error.code === '23505') return null;
        throw error;
      }

      return gtm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-time-matches'] });
    },
  });
}

/** Get active game-time matches for current user */
export function useMyGameTimeMatches() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['game-time-matches', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('game_time_matches')
        .select('*')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .eq('status', 'active')
        .gte('expires_at', now)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
}
