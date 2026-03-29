import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Zap, Beer, Eye } from 'lucide-react';
import { fuzzyLocation, isNearHomeOrWork } from '@/lib/location-privacy';

// Wrigley Field center
const WRIGLEY_CENTER: [number, number] = [41.9484, -87.6553];

// Known bar locations around Wrigley
const BAR_COORDS: Record<string, [number, number]> = {
  "Murphy's Bleachers": [41.9498, -87.6556],
  'Sluggers': [41.9478, -87.6559],
  "Casey Moran's": [41.9501, -87.6559],
  'Cubby Bear': [41.9474, -87.6565],
  "Bernie's Tap & Grill": [41.9503, -87.6559],
  'Sports Corner': [41.9473, -87.6578],
  'Old Crow Smokehouse': [41.9465, -87.6558],
  'Nisei Lounge': [41.9450, -87.6556],
};

// Custom emoji marker creator
function emojiIcon(emoji: string, size: number = 28) {
  return L.divIcon({
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${emoji}</div>`,
    className: 'emoji-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function countIcon(count: number, color: string) {
  return L.divIcon({
    html: `<div style="
      background:${color};
      color:white;
      width:32px;height:32px;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:13px;
      box-shadow:0 2px 8px ${color}66;
      border:2px solid white;
    ">${count}</div>`,
    className: 'count-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Component to auto-fit bounds
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [positions, map]);
  return null;
}

type ToggleKey = 'fans' | 'meetups' | 'bars';

const TOGGLE_OPTIONS: { key: ToggleKey; label: string; icon: typeof Users; emoji: string }[] = [
  { key: 'fans', label: 'Fans', icon: Users, emoji: '👤' },
  { key: 'meetups', label: 'Meetups', icon: Zap, emoji: '⚡' },
  { key: 'bars', label: 'Bars', icon: Beer, emoji: '🍻' },
];

export function GameDayMap() {
  const { user } = useAuth();
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    fans: true,
    meetups: true,
    bars: true,
  });

  const toggle = (key: ToggleKey) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  // Fetch fans with locations
  const { data: fanPins = [] } = useQuery({
    queryKey: ['map-fan-pins'],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: fans } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo, game_status, wrigley_section, wrigleyville_bar, wrigley_location_privacy, bar_location_privacy')
        .eq('is_banned', false)
        .eq('onboarding_completed', true)
        .neq('game_status', 'NotSet')
        .gte('location_last_set_at', sixHoursAgo)
        .limit(100);

      if (!fans) return [];

      // Get locations for these fans
      const userIds = fans.map((f) => f.user_id);
      const { data: locations } = await supabase
        .from('user_locations')
        .select('user_id, latitude, longitude')
        .in('user_id', userIds);

      const locMap = new Map(locations?.map((l) => [l.user_id, l]) ?? []);

      return fans.map((f) => {
        const loc = locMap.get(f.user_id);
        // Use real location if available, otherwise approximate from bar/wrigley
        let lat = loc?.latitude;
        let lng = loc?.longitude;

        if (!lat || !lng) {
          if (f.game_status === 'AtWrigley') {
            // Scatter around Wrigley
            lat = WRIGLEY_CENTER[0] + (Math.random() - 0.5) * 0.002;
            lng = WRIGLEY_CENTER[1] + (Math.random() - 0.5) * 0.002;
          } else if (f.game_status === 'AtBar' && f.wrigleyville_bar) {
            const barCoord = BAR_COORDS[f.wrigleyville_bar];
            if (barCoord) {
              lat = barCoord[0] + (Math.random() - 0.5) * 0.0005;
              lng = barCoord[1] + (Math.random() - 0.5) * 0.0005;
            }
          }
        }

        if (!lat || !lng) return null;

        return {
          id: f.user_id,
          name: f.display_name,
          photo: f.profile_photo,
          status: f.game_status as string,
          lat,
          lng,
        };
      }).filter(Boolean) as Array<{
        id: string; name: string; photo: string | null; status: string; lat: number; lng: number;
      }>;
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  // Fetch active meetups
  const { data: meetupPins = [] } = useQuery({
    queryKey: ['map-meetup-pins'],
    queryFn: async () => {
      const { data } = await supabase
        .from('game_time_matches')
        .select('id, meeting_spot, created_at, expires_at')
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .limit(20);

      return (data ?? []).map((m) => ({
        id: m.id,
        spot: m.meeting_spot,
        createdAt: m.created_at,
        // Place meetups near Wrigley with slight randomness
        lat: WRIGLEY_CENTER[0] + (Math.random() - 0.5) * 0.003,
        lng: WRIGLEY_CENTER[1] + (Math.random() - 0.5) * 0.003,
      }));
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  // Fetch bar data with counts
  const { data: barPins = [] } = useQuery({
    queryKey: ['map-bar-pins'],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('profiles')
        .select('wrigleyville_bar')
        .eq('game_status', 'AtBar')
        .eq('is_banned', false)
        .gte('location_last_set_at', sixHoursAgo)
        .not('wrigleyville_bar', 'is', null);

      const counts: Record<string, number> = {};
      data?.forEach((p) => {
        const bar = p.wrigleyville_bar as string;
        counts[bar] = (counts[bar] || 0) + 1;
      });

      return Object.entries(BAR_COORDS).map(([name, coords]) => ({
        name,
        lat: coords[0],
        lng: coords[1],
        count: counts[name] ?? 0,
      }));
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  // Heat zones — areas with high fan density
  const heatZones = useMemo(() => {
    if (!fanPins.length) return [];
    // Cluster fans into zones
    const wrigleyFans = fanPins.filter((f) => f.status === 'AtWrigley');
    const zones: Array<{ center: [number, number]; count: number; radius: number; color: string }> = [];

    if (wrigleyFans.length >= 2) {
      zones.push({
        center: WRIGLEY_CENTER,
        count: wrigleyFans.length,
        radius: Math.min(150 + wrigleyFans.length * 15, 400),
        color: 'hsl(210, 80%, 55%)',
      });
    }

    // Bar clusters
    barPins.forEach((bar) => {
      if (bar.count >= 2) {
        zones.push({
          center: [bar.lat, bar.lng],
          count: bar.count,
          radius: Math.min(60 + bar.count * 20, 200),
          color: 'hsl(35, 90%, 55%)',
        });
      }
    });

    return zones;
  }, [fanPins, barPins]);

  // All positions for fitting bounds
  const allPositions = useMemo(() => {
    const pts: [number, number][] = [WRIGLEY_CENTER];
    if (toggles.fans) fanPins.forEach((f) => pts.push([f.lat, f.lng]));
    if (toggles.bars) barPins.forEach((b) => pts.push([b.lat, b.lng]));
    return pts;
  }, [fanPins, barPins, toggles]);

  const STATUS_EMOJI: Record<string, string> = {
    AtWrigley: '⚾️',
    AtBar: '🍺',
    Tailgating: '🌭',
    BeerSnake: '🐍',
    WatchingRemote: '📺',
  };

  const totalVisible =
    (toggles.fans ? fanPins.length : 0) +
    (toggles.meetups ? meetupPins.length : 0) +
    (toggles.bars ? barPins.filter((b) => b.count > 0).length : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
            Live Map
          </h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {totalVisible} on map
          </span>
        </div>
      </div>

      {/* Toggle bar */}
      <div className="flex gap-1.5 px-3 py-2 bg-muted/30 border-b border-border">
        {TOGGLE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = toggles[opt.key];
          return (
            <button
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3 w-3" />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="h-[360px] relative">
        <MapContainer
          center={WRIGLEY_CENTER}
          zoom={15}
          className="h-full w-full z-0"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />
          <FitBounds positions={allPositions} />

          {/* Heat zones */}
          {heatZones.map((zone, i) => (
            <Circle
              key={`heat-${i}`}
              center={zone.center}
              radius={zone.radius}
              pathOptions={{
                fillColor: zone.color,
                fillOpacity: 0.18,
                color: zone.color,
                weight: 1.5,
                opacity: 0.4,
              }}
            />
          ))}

          {/* Fan pins */}
          {toggles.fans &&
            fanPins.map((fan) => (
              <Marker
                key={`fan-${fan.id}`}
                position={[fan.lat, fan.lng]}
                icon={emojiIcon(STATUS_EMOJI[fan.status] || '👤', 24)}
              >
                <Popup className="fan-popup" closeButton={false}>
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                      {fan.photo ? (
                        <img src={fan.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {fan.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{fan.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {STATUS_EMOJI[fan.status]} {fan.status === 'AtWrigley' ? 'At Wrigley' : fan.status === 'AtBar' ? 'At a Bar' : fan.status}
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Meetup pins */}
          {toggles.meetups &&
            meetupPins.map((m) => (
              <Marker
                key={`meetup-${m.id}`}
                position={[m.lat, m.lng]}
                icon={emojiIcon('⚡', 30)}
              >
                <Popup closeButton={false}>
                  <div className="min-w-[120px]">
                    <p className="text-sm font-semibold">⚡ Active Meetup</p>
                    <p className="text-xs text-muted-foreground">{m.spot}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Bar pins */}
          {toggles.bars &&
            barPins.map((bar) => (
              <Marker
                key={`bar-${bar.name}`}
                position={[bar.lat, bar.lng]}
                icon={bar.count > 0 ? countIcon(bar.count, 'hsl(35, 90%, 45%)') : emojiIcon('🍻', 20)}
              >
                <Popup closeButton={false}>
                  <div className="min-w-[130px]">
                    <p className="text-sm font-semibold">🍻 {bar.name}</p>
                    {bar.count > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {bar.count} fan{bar.count !== 1 ? 's' : ''} here now
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No fans checked in</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Legend overlay */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-lg">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'hsl(210, 80%, 55%)' }} />
              Fan zone
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'hsl(35, 90%, 55%)' }} />
              Bar zone
            </span>
            <span>⚡ Meetup</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
