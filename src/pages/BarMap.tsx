import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AppHeader } from '@/components/AppHeader';
import { WRIGLEYVILLE_BARS } from '@/types';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { GuestBanner } from '@/components/GuestBanner';
import { BarDetailSheet } from '@/components/map/BarDetailSheet';
import { useVenueActivity } from '@/hooks/useVenueActivity';
import { usePubCrawls } from '@/hooks/usePubCrawls';
import { useBarCheckins } from '@/hooks/useBarCheckins';
import barIconImg from '@/assets/map/bar-icon.png';
import landmarkIconImg from '@/assets/map/landmark-icon.png';

const WRIGLEY_CENTER: [number, number] = [41.9484, -87.6553];

const BAR_LOCATIONS: Record<string, { lat: number; lng: number; type: 'bar' | 'landmark' }> = {
  "Almost Home Tavern & Grill": { lat: 41.9493, lng: -87.6578, type: 'bar' },
  "Begyle Brewing Company": { lat: 41.9585, lng: -87.6810, type: 'bar' },
  "Bernie's": { lat: 41.9503, lng: -87.6559, type: 'bar' },
  "Cork Lounge": { lat: 41.9475, lng: -87.6750, type: 'bar' },
  "Demo Brewing Company": { lat: 41.9575, lng: -87.6830, type: 'bar' },
  "Dovetail Brewery": { lat: 41.9590, lng: -87.6810, type: 'bar' },
  "F. O'Mahony's": { lat: 41.9495, lng: -87.6480, type: 'bar' },
  "Farm Bar Ravenswood": { lat: 41.9615, lng: -87.6785, type: 'bar' },
  "GMAN Tavern": { lat: 41.9505, lng: -87.6560, type: 'bar' },
  "Kit Kat Lounge & Supper Club": { lat: 41.9455, lng: -87.6490, type: 'bar' },
  "Lucky Dorr": { lat: 41.9495, lng: -87.6565, type: 'landmark' },
  "Martyrs'": { lat: 41.9520, lng: -87.6685, type: 'bar' },
  "Metro Chicago": { lat: 41.9498, lng: -87.6562, type: 'landmark' },
  "Moe's Cantina": { lat: 41.9460, lng: -87.6560, type: 'bar' },
  "Mordecai": { lat: 41.9487, lng: -87.6560, type: 'bar' },
  "Murphy's Bleachers": { lat: 41.9498, lng: -87.6536, type: 'bar' },
  "Smartbar": { lat: 41.9498, lng: -87.6562, type: 'bar' },
  "The Cubby Bear Lounge Chicago": { lat: 41.9474, lng: -87.6565, type: 'bar' },
  "The Dugout Sports Bar and Grill": { lat: 41.9474, lng: -87.6545, type: 'bar' },
  "The Long Room": { lat: 41.9540, lng: -87.6700, type: 'bar' },
  "The North End": { lat: 41.9505, lng: -87.6490, type: 'bar' },
  "The Ravenswood Tavern": { lat: 41.9610, lng: -87.6795, type: 'bar' },
  "The Sports Corner Bar and Grill": { lat: 41.9474, lng: -87.6540, type: 'bar' },
  "Toons Bar & Grill": { lat: 41.9468, lng: -87.6635, type: 'bar' },
  "Trace": { lat: 41.9502, lng: -87.6560, type: 'bar' },
  "Wolcott Tap": { lat: 41.9610, lng: -87.6785, type: 'bar' },
  "Yak-Zie's Bar & Grill": { lat: 41.9500, lng: -87.6560, type: 'bar' },
};

function getCrowdLabel(checkinCount: number, venueLevel?: string): { label: string; color: string } {
  const level = venueLevel || (checkinCount === 0 ? 'empty' : checkinCount <= 3 ? 'chill' : checkinCount <= 8 ? 'busy' : 'packed');
  switch (level) {
    case 'packed': return { label: '🔥 Packed', color: '#ef4444' };
    case 'busy': return { label: '⚡ Active', color: '#f59e0b' };
    case 'chill': return { label: '😎 Chill', color: '#3b82f6' };
    default: return { label: '💤 Quiet', color: '#94a3b8' };
  }
}

function createHeritageIcon(type: 'bar' | 'landmark', hasMeetup: boolean, crowd?: string) {
  const imgSrc = type === 'landmark' ? landmarkIconImg : barIconImg;
  const glowRing = hasMeetup ? 'box-shadow: 0 0 12px 4px rgba(34,197,94,0.6); border: 2px solid #22c55e;' : '';
  const crowdInfo = crowd ? getCrowdLabel(0, crowd) : null;
  const crowdBadge = crowdInfo ? `<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);background:${crowdInfo.color};color:white;font-size:8px;font-weight:700;padding:1px 5px;border-radius:8px;white-space:nowrap;line-height:1.3;">${crowdInfo.label}</div>` : '';

  return L.divIcon({
    html: `<div style="width:48px;height:56px;position:relative;display:flex;align-items:flex-start;justify-content:center;cursor:pointer;">
      <img src="${imgSrc}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;${glowRing}" />
      ${crowdBadge}
    </div>`,
    className: 'heritage-pin-marker',
    iconSize: [48, 56],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
}

const wrigleyIcon = L.divIcon({
  html: `<div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
    <div style="width:36px;height:36px;border-radius:50%;background:#dc2626;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;">🏟️</div>
  </div>`,
  className: 'wrigley-marker',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
});

type BarWithCoords = (typeof WRIGLEYVILLE_BARS)[0] & { lat: number; lng: number; type: string };

export default function BarMap() {
  const { isGuest } = useGuestMode();
  const [selectedBar, setSelectedBar] = useState<BarWithCoords | null>(null);
  const { data: venues } = useVenueActivity();
  const { crawls, getStopsForCrawl } = usePubCrawls();
  const { checkins } = useBarCheckins();

  // Count checkins per bar
  const checkinCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    checkins.forEach(c => {
      counts[c.bar_name] = (counts[c.bar_name] || 0) + 1;
    });
    return counts;
  }, [checkins]);

  // Check which bars have active meetups
  const barsWithMeetups = useMemo(() => {
    const set = new Set<string>();
    venues?.forEach(v => {
      if (v.meetups.length > 0) set.add(v.name);
    });
    return set;
  }, [venues]);

  // Get venue crowd level
  const venueLevel = useMemo(() => {
    const map: Record<string, string> = {};
    venues?.forEach(v => { map[v.name] = v.crowdLevel; });
    return map;
  }, [venues]);

  const bars = useMemo(() => {
    return WRIGLEYVILLE_BARS.map((bar) => {
      const coords = BAR_LOCATIONS[bar.name];
      if (!coords) return null;
      return { ...bar, ...coords };
    }).filter(Boolean) as BarWithCoords[];
  }, []);

  // Pub crawl trail lines
  const crawlTrails = useMemo(() => {
    return crawls
      .filter(c => c.status === 'live')
      .map(c => {
        const stops = getStopsForCrawl(c.id);
        const points: [number, number][] = [];
        stops.forEach(s => {
          const loc = BAR_LOCATIONS[s.bar_name];
          if (loc) points.push([loc.lat, loc.lng]);
        });
        return { id: c.id, points, title: c.title };
      })
      .filter(t => t.points.length >= 2);
  }, [crawls, getStopsForCrawl]);

  return (
    <div className={`min-h-screen bg-background ${isGuest ? 'pb-20' : 'pb-24'}`}>
      <AppHeader />
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Wrigleyville Bar Map
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {bars.length} bars plotted · Tap a pin for details
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <img src={barIconImg} className="w-4 h-4 rounded-full" alt="" /> Bars
            </span>
            <span className="flex items-center gap-1">
              <img src={landmarkIconImg} className="w-4 h-4 rounded-full" alt="" /> Landmarks
            </span>
            {crawlTrails.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-4 h-0.5 bg-primary rounded" /> Pub Crawl
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: '65vh' }}>
          <MapContainer
            center={WRIGLEY_CENTER}
            zoom={15}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Wrigley Field */}
            <Marker
              position={WRIGLEY_CENTER}
              icon={wrigleyIcon}
              eventHandlers={{
                click: () => setSelectedBar({
                  id: 'wrigley-field',
                  name: '🏟️ Wrigley Field',
                  address: '1060 W Addison St',
                  lat: WRIGLEY_CENTER[0],
                  lng: WRIGLEY_CENTER[1],
                  type: 'landmark',
                } as any),
              }}
            />

            {/* Heritage bar markers */}
            {bars.map((bar) => {
              const hasMeetup = barsWithMeetups.has(bar.name);
              const crowd = venueLevel[bar.name] || (checkinCounts[bar.name] ? (checkinCounts[bar.name] > 5 ? 'packed' : checkinCounts[bar.name] > 2 ? 'busy' : 'chill') : undefined);
              return (
                <Marker
                  key={bar.id}
                  position={[bar.lat, bar.lng]}
                  icon={createHeritageIcon(bar.type as 'bar' | 'landmark', hasMeetup, crowd)}
                  eventHandlers={{
                    click: () => setSelectedBar(bar),
                  }}
                />
              );
            })}

            {/* Pub crawl trail lines */}
            {crawlTrails.map(trail => (
              <Polyline
                key={trail.id}
                positions={trail.points}
                pathOptions={{
                  color: 'hsl(217, 91%, 60%)',
                  weight: 3,
                  dashArray: '8, 12',
                  opacity: 0.8,
                }}
              />
            ))}
          </MapContainer>
        </div>
      </div>

      <BarDetailSheet
        bar={selectedBar}
        onClose={() => setSelectedBar(null)}
      />

      {isGuest && <GuestBanner />}
    </div>
  );
}
