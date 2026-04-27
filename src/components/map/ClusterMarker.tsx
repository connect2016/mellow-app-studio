import L from 'leaflet';
import { Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import type { VibeFilter, MovementFilter } from './MapFilters';

export interface MapCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  vibe: VibeFilter;
  movement: MovementFilter;
  label: string;
  members: Array<{ name: string; photo: string | null }>;
}

const VIBE_COLORS: Record<VibeFilter, string> = {
  party: 'hsl(350, 83%, 41%)',
  chill: 'hsl(168, 55%, 38%)',
  hardcore: 'hsl(222, 82%, 29%)',
};

const MOVEMENT_ARROWS: Record<MovementFilter, string> = {
  arriving: '↗',
  settled: '•',
  leaving: '↘',
};

const FRIENDLY_LABELS = [
  'Your future crew is right here.',
  'Mini-meetup happening here.',
  'This corner is buzzing.',
] as const;

function pickLabel(id: string): string {
  // Stable hash so each cluster keeps the same label across renders
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return FRIENDLY_LABELS[Math.abs(h) % FRIENDLY_LABELS.length];
}

function clusterIcon(count: number, vibe: VibeFilter, movement: MovementFilter) {
  const color = VIBE_COLORS[vibe];
  const arrow = MOVEMENT_ARROWS[movement];
  const size = Math.min(28 + count * 4, 56);
  const pulseSize = size + 16;
  const ringSize = size + 28;

  return L.divIcon({
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <!-- Outer friendly highlight ring -->
        <div style="
          position:absolute;
          top:50%;left:50%;
          width:${ringSize}px;height:${ringSize}px;
          transform:translate(-50%,-50%);
          border-radius:50%;
          border:2px solid ${color};
          opacity:0.55;
          animation:cluster-pulse 2.4s ease-in-out infinite;
          box-shadow:0 0 18px ${color}66;
        "></div>
        <!-- Inner soft pulse -->
        <div style="
          position:absolute;
          top:50%;left:50%;
          width:${pulseSize}px;height:${pulseSize}px;
          transform:translate(-50%,-50%);
          border-radius:50%;
          background:${color};
          opacity:0.18;
          animation:cluster-pulse 2s ease-in-out infinite;
          animation-delay:0.3s;
        "></div>
        <div style="
          position:relative;
          width:${size}px;height:${size}px;
          border-radius:50%;
          background:${color};
          color:white;
          display:flex;align-items:center;justify-content:center;
          font-weight:800;font-size:${Math.max(12, size * 0.35)}px;
          box-shadow:0 3px 12px ${color}55;
          border:2.5px solid white;
          font-family:'Barlow Condensed',sans-serif;
          cursor:pointer;
        ">
          ${count}
          <span style="
            position:absolute;
            top:-2px;right:-4px;
            font-size:10px;
            background:white;
            color:${color};
            width:16px;height:16px;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-weight:700;
            box-shadow:0 1px 3px rgba(0,0,0,0.2);
          ">${arrow}</span>
        </div>
      </div>
    `,
    className: 'cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function ClusterMarkerComponent({ cluster }: { cluster: MapCluster }) {
  const map = useMap();
  const friendly = pickLabel(cluster.id);

  const vibeLabels: Record<VibeFilter, string> = {
    party: '🔥 Party Vibe',
    chill: '☕ Chill Vibe',
    hardcore: '🏆 Hardcore Fans',
  };

  const movementLabels: Record<MovementFilter, string> = {
    arriving: '↗ Arriving now',
    settled: '• Settled in',
    leaving: '↘ Heading out',
  };

  return (
    <Marker
      position={[cluster.lat, cluster.lng]}
      icon={clusterIcon(cluster.count, cluster.vibe, cluster.movement)}
      eventHandlers={{
        click: () => {
          const targetZoom = Math.min((map.getZoom() || 15) + 2, 18);
          map.flyTo([cluster.lat, cluster.lng], targetZoom, { duration: 0.6 });
        },
      }}
    >
      {/* Friendly floating label above the cluster */}
      <Tooltip
        permanent
        direction="top"
        offset={[0, -8]}
        className="cluster-friendly-label"
      >
        <span
          style={{
            fontFamily: 'Norwester, sans-serif',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            color: '#0E3386',
          }}
        >
          {friendly}
        </span>
      </Tooltip>

      <Popup closeButton={false}>
        <div className="min-w-[160px] p-1">
          <p className="text-sm font-bold">{cluster.label}</p>
          <p className="text-[11px] text-muted-foreground italic mt-0.5">{friendly}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            <span>{vibeLabels[cluster.vibe]}</span>
            <span>·</span>
            <span>{movementLabels[cluster.movement]}</span>
          </div>
          <p className="text-xs font-semibold mt-1.5">
            {cluster.count} fan{cluster.count !== 1 ? 's' : ''}
          </p>
          {cluster.members.length > 0 && (
            <div className="flex -space-x-2 mt-1.5">
              {cluster.members.slice(0, 5).map((m, i) => (
                <div
                  key={i}
                  className="h-6 w-6 rounded-full border-2 border-white bg-muted overflow-hidden"
                >
                  {m.photo ? (
                    <img src={m.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                      {m.name?.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
              {cluster.members.length > 5 && (
                <div className="h-6 w-6 rounded-full border-2 border-white bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                  +{cluster.members.length - 5}
                </div>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
