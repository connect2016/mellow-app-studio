import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, ShieldCheck, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const GOOGLE_MAPS_API_KEY = 'AIzaSyC3rzW-wAq6Pl2NU_AePqX5VO15Ar9Wx1E';

// Wrigleyville bounding box for geofencing
const WRIGLEYVILLE_BOUNDS = {
  north: 41.9530,
  south: 41.9420,
  east: -87.6490,
  west: -87.6620,
};

const WRIGLEY_CENTER = { lat: 41.9484, lng: -87.6553 };

// Snap to grid for privacy (~100m cells)
function snapToGrid(lat: number, lng: number): { lat: number; lng: number } {
  const gridSize = 0.001; // ~111m lat, ~85m lng at this latitude
  return {
    lat: Math.round(lat / gridSize) * gridSize,
    lng: Math.round(lng / gridSize) * gridSize,
  };
}

function isInWrigleyville(lat: number, lng: number): boolean {
  return (
    lat >= WRIGLEYVILLE_BOUNDS.south &&
    lat <= WRIGLEYVILLE_BOUNDS.north &&
    lng >= WRIGLEYVILLE_BOUNDS.west &&
    lng <= WRIGLEYVILLE_BOUNDS.east
  );
}

const mapContainerStyle = { width: '100%', height: '100%' };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1a2e1a' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a2e1a' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#6b8f6b' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a4a2a' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a3a1a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1f2e' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1a3a2a' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#5a8a5a' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a3a2a' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ],
};

interface ClusterPoint {
  lat: number;
  lng: number;
  count: number;
}

function useBuddyClusters() {
  return useQuery({
    queryKey: ['buddy-heatmap-clusters'],
    queryFn: async () => {
      // Fetch all recent check-ins (last 6 hours)
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('user_locations')
        .select('latitude, longitude')
        .gte('updated_at', sixHoursAgo);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Snap to grid and aggregate
      const grid = new Map<string, { lat: number; lng: number; count: number }>();
      for (const loc of data) {
        const snapped = snapToGrid(loc.latitude, loc.longitude);
        const key = `${snapped.lat},${snapped.lng}`;
        const existing = grid.get(key);
        if (existing) {
          existing.count++;
        } else {
          grid.set(key, { ...snapped, count: 1 });
        }
      }

      // Only return clusters of 3+
      return Array.from(grid.values()).filter((c) => c.count >= 3);
    },
    refetchInterval: 30000, // refresh every 30s
  });
}

function useCheckinMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coords: { lat: number; lng: number }) => {
      if (!user) throw new Error('Not authenticated');
      // Upsert location
      const { error } = await supabase
        .from('user_locations')
        .upsert(
          { user_id: user.id, latitude: coords.lat, longitude: coords.lng, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buddy-heatmap-clusters'] });
    },
  });
}

// Pulse overlay component rendered on the map
function PulseOverlay({ map, clusters }: { map: google.maps.Map | null; clusters: ClusterPoint[] }) {
  useEffect(() => {
    if (!map || clusters.length === 0) return;

    const overlays: google.maps.marker.AdvancedMarkerElement[] = [];

    // Use regular markers with custom HTML for the pulse effect
    clusters.forEach((cluster) => {
      const size = Math.min(24 + cluster.count * 6, 60);
      const opacity = Math.min(0.4 + cluster.count * 0.08, 0.9);

      const div = document.createElement('div');
      div.style.position = 'relative';
      div.style.width = `${size}px`;
      div.style.height = `${size}px`;

      // Pulse ring
      const pulse = document.createElement('div');
      pulse.style.cssText = `
        position: absolute; inset: 0; border-radius: 50%;
        background: radial-gradient(circle, hsla(222, 82%, 55%, ${opacity}) 0%, hsla(222, 82%, 55%, 0) 70%);
        animation: heatPulse 2s ease-in-out infinite;
      `;
      div.appendChild(pulse);

      // Center dot
      const dot = document.createElement('div');
      dot.style.cssText = `
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: ${Math.max(size * 0.35, 10)}px; height: ${Math.max(size * 0.35, 10)}px;
        border-radius: 50%; background: hsl(222, 82%, 55%);
        box-shadow: 0 0 12px 4px hsla(222, 82%, 55%, 0.5);
      `;
      div.appendChild(dot);

      // Count label
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        font-size: 10px; font-weight: 700; color: white; pointer-events: none;
      `;
      label.textContent = `${cluster.count}`;
      div.appendChild(label);

      const marker = new google.maps.Marker({
        position: { lat: cluster.lat, lng: cluster.lng },
        map,
        icon: {
          url: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'),
          scaledSize: new google.maps.Size(1, 1),
        },
        label: '',
        clickable: false,
      });

      // Use OverlayView for proper HTML rendering
      class PulseOverlayView extends google.maps.OverlayView {
        private div: HTMLDivElement;
        private position: google.maps.LatLng;

        constructor(position: google.maps.LatLng, div: HTMLDivElement) {
          super();
          this.position = position;
          this.div = div;
        }

        onAdd() {
          this.div.style.position = 'absolute';
          const panes = this.getPanes();
          panes?.overlayMouseTarget.appendChild(this.div);
        }

        draw() {
          const projection = this.getProjection();
          if (!projection) return;
          const pos = projection.fromLatLngToDivPixel(this.position);
          if (pos) {
            this.div.style.left = `${pos.x - size / 2}px`;
            this.div.style.top = `${pos.y - size / 2}px`;
          }
        }

        onRemove() {
          this.div.parentNode?.removeChild(this.div);
        }
      }

      const overlay = new PulseOverlayView(
        new google.maps.LatLng(cluster.lat, cluster.lng),
        div
      );
      overlay.setMap(map);

      // Store for cleanup
      (marker as any)._overlay = overlay;
      overlays.push(marker as any);
    });

    return () => {
      overlays.forEach((m: any) => {
        if (m._overlay) m._overlay.setMap(null);
        m.setMap(null);
      });
    };
  }, [map, clusters]);

  return null;
}

export default function BuddyHeatmap() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: clusters = [], isLoading } = useBuddyClusters();
  const checkin = useCheckinMutation();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const totalBuddies = clusters.reduce((sum, c) => sum + c.count, 0);

  const handleCheckIn = () => {
    if (!user) {
      toast({ title: 'Sign in first', description: 'You need to be logged in to check in.', variant: 'destructive' });
      return;
    }

    setCheckingIn(true);
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        if (!isInWrigleyville(latitude, longitude)) {
          setGeoError("You're not in Wrigleyville! Head to the neighborhood and try again.");
          setCheckingIn(false);
          return;
        }

        try {
          await checkin.mutateAsync({ lat: latitude, lng: longitude });
          setCheckedIn(true);
          toast({ title: '📍 You\'re on the map!', description: 'Your check-in is live. Exact location is hidden for privacy.' });
          setTimeout(() => setCheckedIn(false), 5000);
        } catch {
          toast({ title: 'Check-in failed', description: 'Please try again.', variant: 'destructive' });
        } finally {
          setCheckingIn(false);
        }
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? 'Location access denied. Please enable location in your browser settings.'
            : 'Could not determine your location. Please try again.'
        );
        setCheckingIn(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />

      {/* Stats bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-semibold text-foreground">Buddy Heatmap</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{totalBuddies} {totalBuddies === 1 ? 'buddy' : 'buddies'} checked in</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={WRIGLEY_CENTER}
          zoom={16}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          <PulseOverlay map={map} clusters={clusters} />
        </GoogleMap>

        {/* Empty state overlay */}
        {!isLoading && clusters.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border px-6 py-5 text-center max-w-[280px] pointer-events-auto">
              <p className="text-3xl mb-2">📍</p>
              <p className="text-sm font-semibold text-foreground mb-1">The bleachers are empty.</p>
              <p className="text-xs text-muted-foreground">Be the first to check in and start a rally!</p>
            </div>
          </div>
        )}

        {/* Privacy badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border px-2.5 py-1">
          <ShieldCheck className="h-3 w-3 text-accent" />
          <span className="text-[10px] font-semibold text-foreground">Privacy Mode</span>
        </div>

        {/* Legend */}
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-md border border-border rounded-xl px-3 py-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Clusters</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
              <span className="text-[10px] text-muted-foreground">3+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3.5 w-3.5 rounded-full bg-accent/80" />
              <span className="text-[10px] text-muted-foreground">10+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-5 w-5 rounded-full bg-accent" />
              <span className="text-[10px] text-muted-foreground">20+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom check-in bar */}
      <div className="bg-card border-t border-border px-4 py-4 pb-6 safe-area-bottom">
        <AnimatePresence mode="wait">
          {geoError && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 mb-3 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5"
            >
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{geoError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {checkedIn ? (
            <motion.div
              key="checked"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-base font-bold text-accent-foreground"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              <MapPin className="h-5 w-5" />
              You're on the map!
            </motion.div>
          ) : (
            <motion.div key="button" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full rounded-2xl py-6 text-base font-bold gap-2"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                {checkingIn ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying location…
                  </>
                ) : (
                  <>
                    <MapPin className="h-5 w-5" />
                    Check In at Wrigleyville
                  </>
                )}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Your exact location is never shown — only aggregated zones
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes heatPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
