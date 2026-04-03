import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MapFilters, type VibeFilter, type SizeFilter, type MovementFilter } from './map/MapFilters';
import { ClusterMarkerComponent, type MapCluster } from './map/ClusterMarker';
import { QuickActionBar } from './map/QuickActionBar';
import { useMapClusters, type MapFan } from './map/useMapClusters';
import { StatusBubbleMarker } from './map/StatusBubbleMarker';
import { MiniProfileSheet } from './map/MiniProfileSheet';
import { useSendLike } from '@/hooks/useInteractions';

const WRIGLEY_CENTER: [number, number] = [41.9484, -87.6553];

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

export function GameDayMap() {
  const { user } = useAuth();
  const sendLike = useSendLike();
  const [vibeFilters, setVibeFilters] = useState<VibeFilter[]>([]);
  const [sizeFilters, setSizeFilters] = useState<SizeFilter[]>([]);
  const [movementFilters, setMovementFilters] = useState<MovementFilter[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(null);
  const [selectedFan, setSelectedFan] = useState<MapFan | null>(null);

  const toggleArray = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const { clusters, totalFans, fans } = useMapClusters(vibeFilters, sizeFilters, movementFilters);

  // Show individual markers for solo/small clusters, clusters for larger groups
  const soloFans = useMemo(() => {
    // Fans in clusters of 1-2 get individual markers
    const clusteredIds = new Set<string>();
    clusters.filter(c => c.count >= 3).forEach(c => {
      c.members.forEach(m => clusteredIds.add(m.name)); // name-based rough match
    });
    return fans.filter(f => !clusteredIds.has(f.name));
  }, [fans, clusters]);

  const handleHiFive = (fan: MapFan) => {
    sendLike.mutate(
      { toUser: fan.id, isHiFive: true, message: '🖐️ High-Five from the map!' },
      { onSuccess: () => setSelectedFan(null) }
    );
  };

  const allPositions = useMemo(() => {
    const pts: [number, number][] = [WRIGLEY_CENTER];
    clusters.forEach((c) => pts.push([c.lat, c.lng]));
    return pts;
  }, [clusters]);

  // Heat zones from clusters
  const heatZones = useMemo(() => {
    return clusters
      .filter((c) => c.count >= 3)
      .map((c) => {
        const vibeColors: Record<VibeFilter, string> = {
          party: 'hsl(350, 83%, 41%)',
          chill: 'hsl(168, 55%, 38%)',
          hardcore: 'hsl(222, 82%, 29%)',
        };
        return {
          center: [c.lat, c.lng] as [number, number],
          radius: Math.min(80 + c.count * 18, 300),
          color: vibeColors[c.vibe],
        };
      });
  }, [clusters]);

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
          <h3 className="text-sm font-bold text-foreground">
            Live Cluster Map
          </h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {totalFans} fans · {clusters.length} clusters
          </span>
        </div>
      </div>

      {/* Filters */}
      <MapFilters
        vibes={vibeFilters}
        sizes={sizeFilters}
        movements={movementFilters}
        onToggleVibe={(v) => setVibeFilters((prev) => toggleArray(prev, v))}
        onToggleSize={(s) => setSizeFilters((prev) => toggleArray(prev, s))}
        onToggleMovement={(m) => setMovementFilters((prev) => toggleArray(prev, m))}
      />

      {/* Map */}
      <div className="h-[400px] relative">
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
                fillOpacity: 0.15,
                color: zone.color,
                weight: 1.5,
                opacity: 0.35,
              }}
            />
          ))}

          {/* Cluster markers */}
          {clusters.map((cluster) => (
            <ClusterMarkerComponent key={cluster.id} cluster={cluster} />
          ))}

          {/* Individual fan markers with status bubbles */}
          {soloFans.map((fan) => (
            <StatusBubbleMarker key={fan.id} fan={fan} onTap={setSelectedFan} />
          ))}
        </MapContainer>

        {/* Legend overlay */}
        <div className="absolute top-3 right-3 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-lg">
          <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'hsl(350, 83%, 41%)' }} />
              Party
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'hsl(168, 55%, 38%)' }} />
              Chill
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'hsl(222, 82%, 29%)' }} />
              Hardcore
            </span>
          </div>
        </div>

        {/* Quick action bar */}
        <AnimatePresence>
          <QuickActionBar
            selectedCluster={selectedCluster}
            onNavigate={() => toast.success('Opening directions...')}
            onChat={() => toast.success('Opening section chat...')}
            onJoin={() => toast.success("You're heading over! 🎉")}
          />
        </AnimatePresence>

        {/* Mini-profile sheet */}
        <MiniProfileSheet
          fan={selectedFan}
          onClose={() => setSelectedFan(null)}
          onHiFive={handleHiFive}
        />
      </div>
    </motion.div>
  );
}
