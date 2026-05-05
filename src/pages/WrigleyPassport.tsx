import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useIncrementBadge, BADGE_DEFINITIONS } from '@/hooks/usePennants';
import { cn } from '@/lib/utils';
import { MapPin, CheckCircle2, Loader2, Navigation, Trophy, Lock } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';
import { useGeolocation } from '@/hooks/useGeolocation';
import { GeolocationModal } from '@/components/GeolocationModal';

const PASSPORT_THRESHOLD = 5;
const GEO_RADIUS_METERS = 200; // must be within 200m

export interface PassportLocation {
  key: string;
  name: string;
  address: string;
  emoji: string;
  lat: number;
  lng: number;
}

export const PASSPORT_LOCATIONS: PassportLocation[] = [
  { key: 'wrigley_field', name: 'Wrigley Field', address: '1060 W Addison St', emoji: '', lat: 41.9484, lng: -87.6553 },
  { key: 'murphys_bleachers', name: "Murphy's Bleachers", address: '3655 N Sheffield Ave', emoji: '', lat: 41.9493, lng: -87.6535 },
  { key: 'cubby_bear', name: 'The Cubby Bear', address: '1059 W Addison St', emoji: '', lat: 41.9474, lng: -87.6556 },
  { key: 'wrigley_marquee', name: 'Wrigley Field Marquee', address: '1060 W Addison St', emoji: '', lat: 41.9478, lng: -87.6555 },
  { key: 'gallagher_way', name: 'Gallagher Way', address: '3635 N Clark St', emoji: '', lat: 41.9488, lng: -87.6558 },
  { key: 'sluggers', name: 'Sluggers World Class Sports Bar', address: '3540 N Clark St', emoji: '', lat: 41.9465, lng: -87.6560 },
  { key: 'lucky_dorr', name: 'Lucky Dorr', address: '1101 W Waveland Ave', emoji: '', lat: 41.9495, lng: -87.6565 },
  { key: 'sports_corner', name: 'The Sports Corner', address: '956 W Addison St', emoji: '', lat: 41.9474, lng: -87.6540 },
  { key: 'captain_morgan_club', name: 'Captain Morgan Club', address: 'Inside Wrigley Field', emoji: '', lat: 41.9486, lng: -87.6557 },
  { key: 'sheffield_clock', name: 'Sheffield & Addison Corner', address: 'Sheffield Ave & Addison St', emoji: '', lat: 41.9474, lng: -87.6530 },
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function WrigleyPassport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const incrementBadge = useIncrementBadge();
  const geo = useGeolocation();
  const [checkingLocation, setCheckingLocation] = useState<string | null>(null);

  const { data: checkins = [] } = useQuery({
    queryKey: ['passport-checkins', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('passport_checkins')
        .select('*')
        .eq('user_id', user.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const checkedKeys = new Set(checkins.map((c) => c.location_key));
  const checkedCount = checkedKeys.size;
  const legendUnlocked = checkedCount >= PASSPORT_THRESHOLD;
  const progressPct = Math.min((checkedCount / PASSPORT_THRESHOLD) * 100, 100);

  const checkinMutation = useMutation({
    mutationFn: async (location: PassportLocation) => {
      if (!user) throw new Error('Not logged in');

      // Get user position via gated hook
      const pos = await geo.requestPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const distance = haversineDistance(
        pos.lat,
        pos.lng,
        location.lat,
        location.lng
      );

      if (distance > GEO_RADIUS_METERS) {
        throw new Error(
          `You're ${Math.round(distance)}m away. Get within ${GEO_RADIUS_METERS}m of ${location.name} to check in!`
        );
      }

      const { error } = await supabase
        .from('passport_checkins')
        .insert({ user_id: user.id, location_key: location.key });
      if (error) throw error;

      // Check if this brings them to threshold
      const newCount = checkedCount + 1;
      if (newCount >= PASSPORT_THRESHOLD) {
        await incrementBadge.mutateAsync('wrigley_legend');
      }

      return { location, newCount };
    },
    onSuccess: ({ location, newCount }) => {
      qc.invalidateQueries({ queryKey: ['passport-checkins'] });
      toast({ title: ` ${location.name} stamped!`, description: `${newCount}/${PASSPORT_LOCATIONS.length} locations visited` });
      if (newCount === PASSPORT_THRESHOLD) {
        setTimeout(() => {
          toast({ title: ' Wrigley Legend Unlocked!', description: 'Your badge is now on your profile!' });
        }, 1000);
      }
      setCheckingLocation(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Check-in failed', description: err.message, variant: 'destructive' });
      setCheckingLocation(null);
    },
  });

  const handleCheckIn = (location: PassportLocation) => {
    if (!('geolocation' in navigator)) {
      toast({ title: 'Geolocation not supported', description: 'Your browser doesn\'t support location services.', variant: 'destructive' });
      return;
    }
    if (geo.permission !== 'granted') {
      // Open the privacy modal — check-in continues after user grants.
      geo.setShowModal(true);
      return;
    }
    setCheckingLocation(location.key);
    checkinMutation.mutate(location);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Navigation className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Wrigley Passport
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visit iconic spots to earn stamps & unlock your badge
          </p>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-border bg-card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">
              {checkedCount} / {PASSPORT_LOCATIONS.length} Stamped
            </span>
            {legendUnlocked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 border border-accent/25 px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                <Trophy className="h-3 w-3" /> Wrigley Legend
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {PASSPORT_THRESHOLD - checkedCount} more for  badge
              </span>
            )}
          </div>
          <Progress value={progressPct} className="h-2.5" />
        </div>

        {/* Locations */}
        <div className="space-y-2">
          {PASSPORT_LOCATIONS.map((loc, i) => {
            const isChecked = checkedKeys.has(loc.key);
            const isChecking = checkingLocation === loc.key;

            return (
              <motion.div
                key={loc.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-4 py-3',
                  isChecked
                    ? 'border-primary/30 bg-primary/[0.04]'
                    : 'border-border bg-card'
                )}
              >
                {/* Icon */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg shrink-0">
                  {isChecked ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <span><ConceptVisual name={loc.emoji} size="sm" /></span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-semibold truncate',
                    isChecked ? 'text-primary' : 'text-foreground'
                  )}>
                    {loc.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{loc.address}</p>
                </div>

                {/* Action */}
                {isChecked ? (
                  <span className="text-[10px] font-semibold text-primary uppercase">Stamped</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-xs h-8 gap-1"
                    disabled={isChecking}
                    onClick={() => handleCheckIn(loc)}
                  >
                    {isChecking ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <MapPin className="h-3 w-3" />
                    )}
                    {isChecking ? 'Verifying...' : 'Check In'}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend info */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-4 text-center">
          {legendUnlocked ? (
            <div>
              <span className="text-3xl"></span>
              <p className="text-sm font-bold text-foreground mt-2">
                You're a Wrigley Legend!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your badge is displayed on your profile for all fans to see.
              </p>
            </div>
          ) : (
            <div>
              <Lock className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-foreground">
                Wrigley Legend Badge
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Check in at {PASSPORT_THRESHOLD} locations to unlock this badge on your profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
