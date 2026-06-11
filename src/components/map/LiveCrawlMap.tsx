import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Users } from 'lucide-react';
import { PubCrawlStop } from '@/hooks/usePubCrawls';
import barIconImg from '@/assets/map/bar-icon.png';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const WRIGLEY_CENTER: [number, number] = [41.9484, -87.6553];

const BAR_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  "Almost Home Tavern & Grill": { lat: 41.9493, lng: -87.6578 },
  "Begyle Brewing Company": { lat: 41.9585, lng: -87.6810 },
  "Bernie's": { lat: 41.9503, lng: -87.6559 },
  "Cork Lounge": { lat: 41.9475, lng: -87.6750 },
  "Demo Brewing Company": { lat: 41.9575, lng: -87.6830 },
  "Dovetail Brewery": { lat: 41.9590, lng: -87.6810 },
  "F. O'Mahony's": { lat: 41.9495, lng: -87.6480 },
  "Farm Bar Ravenswood": { lat: 41.9615, lng: -87.6785 },
  "GMAN Tavern": { lat: 41.9505, lng: -87.6560 },
  "Kit Kat Lounge & Supper Club": { lat: 41.9455, lng: -87.6490 },
  "Lucky Dorr": { lat: 41.9495, lng: -87.6565 },
  "Martyrs'": { lat: 41.9520, lng: -87.6685 },
  "Metro Chicago": { lat: 41.9498, lng: -87.6562 },
  "Moe's Cantina": { lat: 41.9460, lng: -87.6560 },
  "Mordecai": { lat: 41.9487, lng: -87.6560 },
  "Murphy's Bleachers": { lat: 41.9498, lng: -87.6536 },
  "Smartbar": { lat: 41.9498, lng: -87.6562 },
  "The Cubby Bear Lounge Chicago": { lat: 41.9474, lng: -87.6565 },
  "The Dugout Sports Bar and Grill": { lat: 41.9474, lng: -87.6545 },
  "The Long Room": { lat: 41.9540, lng: -87.6700 },
  "The North End": { lat: 41.9505, lng: -87.6490 },
  "The Ravenswood Tavern": { lat: 41.9610, lng: -87.6795 },
  "The Sports Corner Bar and Grill": { lat: 41.9474, lng: -87.6540 },
  "Toons Bar & Grill": { lat: 41.9468, lng: -87.6635 },
  "Trace": { lat: 41.9502, lng: -87.6560 },
  "Wolcott Tap": { lat: 41.9610, lng: -87.6785 },
  "Yak-Zie's Bar & Grill": { lat: 41.9500, lng: -87.6560 },
};

function createStopIcon(order: number, arrived: boolean, isCurrent: boolean) {
  const bg = isCurrent
    ? '#dc2626'
    : arrived
    ? '#16a34a'
    : '#64748b';
  const ring = isCurrent ? 'box-shadow: 0 0 16px 5px rgba(220,38,38,0.5); animation: pulse 2s infinite;' : '';
  return L.divIcon({
    html: `<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <div style="width:32px;height:32px;border-radius:50%;background:${bg};border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:white;${ring}">${order}</div>
    </div>`,
    className: 'crawl-stop-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function createAvatarIcon(profilePhoto?: string) {
  const img = profilePhoto
    ? `<img src="${profilePhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" loading="lazy" decoding="async" />`
    : `<div style="width:100%;height:100%;background:#3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;"></div>`;
  return L.divIcon({
    html: `<div style="width:44px;height:44px;border-radius:50%;border:3px solid #3b82f6;overflow:hidden;box-shadow:0 0 20px 6px rgba(59,130,246,0.5);animation:pulse 2s infinite;">
      ${img}
    </div>`,
    className: 'avatar-crawl-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

interface LiveCrawlMapProps {
  stops: PubCrawlStop[];
  crawlTitle: string;
  memberCount: number;
  isCreator: boolean;
  isInCrawl: boolean;
  profilePhoto?: string;
  onMarkArrived: (stopId: string) => void;
  onJoin: () => void;
  onLeave: () => void;
  onBack: () => void;
}

export function LiveCrawlMap({
  stops,
  crawlTitle,
  memberCount,
  isCreator,
  isInCrawl,
  profilePhoto,
  onMarkArrived,
  onJoin,
  onLeave,
  onBack,
}: LiveCrawlMapProps) {
  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.stop_order - b.stop_order),
    [stops]
  );

  // Current stop = last arrived, or first if none arrived
  const currentStopIndex = useMemo(() => {
    const lastArrived = sortedStops.reduce((acc, s, i) => (s.arrived_at ? i : acc), -1);
    return lastArrived >= 0 ? lastArrived : 0;
  }, [sortedStops]);

  const currentStop = sortedStops[currentStopIndex];
  const nextStop = sortedStops[currentStopIndex + 1];
  const currentBarName = currentStop?.bar_name;

  // Route polyline
  const routePoints = useMemo(() => {
    return sortedStops
      .map((s) => {
        const loc = BAR_LOCATIONS[s.bar_name];
        return loc ? [loc.lat, loc.lng] as [number, number] : null;
      })
      .filter(Boolean) as [number, number][];
  }, [sortedStops]);

  // Visited trail (solid)
  const visitedPoints = useMemo(() => {
    return sortedStops
      .filter((s) => s.arrived_at)
      .map((s) => {
        const loc = BAR_LOCATIONS[s.bar_name];
        return loc ? [loc.lat, loc.lng] as [number, number] : null;
      })
      .filter(Boolean) as [number, number][];
  }, [sortedStops]);

  // Avatar position = current stop location
  const avatarPos = useMemo(() => {
    if (!currentBarName) return null;
    const loc = BAR_LOCATIONS[currentBarName];
    return loc ? [loc.lat, loc.lng] as [number, number] : null;
  }, [currentBarName]);

  const mapCenter = avatarPos || (routePoints.length > 0 ? routePoints[0] : WRIGLEY_CENTER);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground min-h-[44px] flex items-center gap-1">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground animate-pulse">
            LIVE
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> {memberCount}
          </span>
        </div>
      </div>

      <h2 className="text-lg font-bold text-foreground">{crawlTitle}</h2>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: '50vh' }}>
        <MapContainer
          center={mapCenter}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Full route (dashed) */}
          {routePoints.length >= 2 && (
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: '#475569',
                weight: 3,
                dashArray: '10, 14',
                opacity: 0.5,
              }}
            />
          )}

          {/* Visited trail (solid green) */}
          {visitedPoints.length >= 2 && (
            <Polyline
              positions={visitedPoints}
              pathOptions={{
                color: '#16a34a',
                weight: 4,
                opacity: 0.9,
              }}
            />
          )}

          {/* Stop markers */}
          {sortedStops.map((stop, i) => {
            const loc = BAR_LOCATIONS[stop.bar_name];
            if (!loc) return null;
            const isCurrent = i === currentStopIndex;
            return (
              <Marker
                key={stop.id}
                position={[loc.lat, loc.lng]}
                icon={createStopIcon(stop.stop_order, !!stop.arrived_at, isCurrent)}
              >
                <Tooltip direction="top" offset={[0, -20]}>
                  <span className="font-semibold text-xs">
                    {stop.stop_order}. {stop.bar_name}
                    {stop.arrived_at ? ' ' : ''}
                    {isCurrent ? '  NOW' : ''}
                  </span>
                </Tooltip>
              </Marker>
            );
          })}

          {/* Avatar marker at current position */}
          {avatarPos && (
            <Marker
              position={avatarPos}
              icon={createAvatarIcon(profilePhoto)}
              zIndexOffset={1000}
            >
              <Tooltip direction="top" offset={[0, -25]} permanent>
                <span className="font-bold text-[10px]">The Pack is here!</span>
              </Tooltip>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Stop progress */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {sortedStops.map((stop, i) => (
          <div key={stop.id} className="flex items-center shrink-0">
            <div
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                i === currentStopIndex
                  ? 'bg-destructive text-destructive-foreground shadow-sm'
                  : stop.arrived_at
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <MapPin className="h-3 w-3" />
              {stop.bar_name.length > 14 ? stop.bar_name.slice(0, 14) + '…' : stop.bar_name}
              {stop.arrived_at && <span></span>}
            </div>
            {i < sortedStops.length - 1 && (
              <span className="text-muted-foreground/30 mx-0.5">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Current location banner + actions */}
      {currentBarName && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Now at</p>
              <p className="text-base font-bold text-foreground">{currentBarName}</p>
            </div>
          </div>

          {/* Creator: Mark next stop */}
          {isCreator && nextStop && !nextStop.arrived_at && (
            <Button
              className="w-full rounded-xl font-bold gap-2"
              onClick={() => onMarkArrived(nextStop.id)}
            >
              <MapPin className="h-4 w-4" />
              Arrived at {nextStop.bar_name.length > 20 ? nextStop.bar_name.slice(0, 20) + '…' : nextStop.bar_name}
            </Button>
          )}

          {/* Not in crawl: Join */}
          {!isInCrawl && (
            <Button
              className="w-full rounded-xl font-bold gap-2 bg-primary"
              onClick={onJoin}
            >
               The Pack is at {currentBarName.length > 15 ? currentBarName.slice(0, 15) + '…' : currentBarName} — Join Them!
            </Button>
          )}

          {/* In crawl: Leave option */}
          {isInCrawl && !isCreator && (
            <Button
              variant="outline"
              className="w-full rounded-xl font-bold text-xs"
              onClick={onLeave}
            >
              Leave Crawl
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
