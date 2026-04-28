import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCrowdEnergy, type EnergyZone, type EnergyType } from '@/hooks/useCrowdEnergy';
import { Users, Flame, PartyPopper, Coffee, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const WRIGLEY_CENTER: [number, number] = [41.9484, -87.6553];

const ENERGY_CONFIG: Record<EnergyType, {
  color: string;
  hsl: string;
  icon: typeof Flame;
  label: string;
  gradient: string;
}> = {
  celebration: {
    color: 'hsl(45, 93%, 47%)',
    hsl: '45, 93%, 47%',
    icon: PartyPopper,
    label: 'Celebration',
    gradient: 'from-yellow-500/20 to-yellow-500/5',
  },
  hype: {
    color: 'hsl(15, 90%, 50%)',
    hsl: '15, 90%, 50%',
    icon: Flame,
    label: 'Hype',
    gradient: 'from-orange-500/20 to-orange-500/5',
  },
  chill: {
    color: 'hsl(200, 70%, 50%)',
    hsl: '200, 70%, 50%',
    icon: Coffee,
    label: 'Chill',
    gradient: 'from-sky-500/20 to-sky-500/5',
  },
};

function createEnergyIcon(zone: EnergyZone) {
  const config = ENERGY_CONFIG[zone.energy];
  const size = Math.max(32, Math.min(56, 28 + zone.intensity * 0.28));

  return L.divIcon({
    className: 'energy-marker',
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        border-radius: 50%;
        background: radial-gradient(circle, ${config.color}44, ${config.color}11);
        border: 2.5px solid ${config.color};
        display: flex; align-items: center; justify-content: center;
        font-size: ${size * 0.4}px;
        box-shadow: 0 0 ${zone.intensity * 0.3}px ${config.color}66;
        animation: energy-pulse ${2.5 - zone.intensity * 0.015}s ease-in-out infinite;
        cursor: pointer;
        position: relative;
      ">
        ${zone.topEmoji}
        <span style="
          position: absolute; bottom: -6px; right: -4px;
          background: ${config.color}; color: white;
          font-size: 9px; font-weight: 800;
          padding: 1px 4px; border-radius: 8px;
          min-width: 16px; text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">${zone.fanCount}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function EnergyZonePopup({ zone }: { zone: EnergyZone }) {
  const navigate = useNavigate();
  const config = ENERGY_CONFIG[zone.energy];
  const Icon = config.icon;

  return (
    <div className="w-52 p-0.5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{zone.topEmoji}</span>
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">{zone.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 h-4 border-0"
              style={{ background: `${config.color}22`, color: config.color }}
            >
              <Icon className="h-2.5 w-2.5 mr-0.5" />
              {config.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Energy bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-muted-foreground">Energy</span>
          <span className="text-[10px] font-bold" style={{ color: config.color }}>{zone.intensity}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${zone.intensity}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full"
            style={{ background: config.color }}
          />
        </div>
      </div>

      {/* Fans */}
      <div className="flex items-center gap-1.5 mb-2">
        <Users className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{zone.fanCount} fans</span>
        {zone.fans.length > 0 && (
          <div className="flex -space-x-1.5 ml-auto">
            {zone.fans.slice(0, 4).map(f => (
              <div key={f.user_id} className="h-5 w-5 rounded-full border border-background bg-muted overflow-hidden">
                {f.profile_photo ? (
                  <img src={f.profile_photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[7px] font-bold text-muted-foreground">
                    {f.display_name?.charAt(0)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        size="sm"
        className="w-full h-7 text-[10px] rounded-lg gap-1"
        onClick={() => {
          if (zone.type === 'bar') {
            navigate('/venues');
          } else {
            navigate('/game-day');
          }
        }}
      >
        <Zap className="h-3 w-3" /> Go here <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function CrowdEnergyMap() {
  const { data, isLoading } = useCrowdEnergy();
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyType | null>(null);

  const zones = (data?.zones ?? []).filter(z => !selectedEnergy || z.energy === selectedEnergy);

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
            Crowd Energy Map
          </h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {data?.zones.length ?? 0} zones
          </span>
        </div>
        {data && (
          <div className="flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-xs font-bold text-foreground">{Math.round((data.totalEnergy / Math.max(data.zones.length, 1)))}</span>
            <span className="text-[10px] text-muted-foreground">avg energy</span>
          </div>
        )}
      </div>

      {/* Energy type filters */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setSelectedEnergy(null)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
            !selectedEnergy ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          All
        </button>
        {(Object.entries(ENERGY_CONFIG) as [EnergyType, typeof ENERGY_CONFIG[EnergyType]][]).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={type}
              onClick={() => setSelectedEnergy(selectedEnergy === type ? null : type)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                selectedEnergy === type ? 'text-white shadow-sm' : 'bg-muted text-muted-foreground'
              }`}
              style={selectedEnergy === type ? { background: config.color } : undefined}
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="h-[380px] relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-muted/20">
            <div className="animate-pulse text-center">
              <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Scanning crowd energy...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={WRIGLEY_CENTER}
            zoom={16}
            className="h-full w-full z-0"
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            />

            {/* Energy radius circles */}
            {zones.map(zone => {
              const config = ENERGY_CONFIG[zone.energy];
              const radius = 40 + zone.intensity * 1.5 + zone.fanCount * 8;
              return (
                <Circle
                  key={`circle-${zone.id}`}
                  center={[zone.lat, zone.lng]}
                  radius={radius}
                  pathOptions={{
                    fillColor: config.color,
                    fillOpacity: 0.12 + zone.intensity * 0.002,
                    color: config.color,
                    weight: 1.5,
                    opacity: 0.3,
                  }}
                />
              );
            })}

            {/* Energy markers */}
            {zones.map(zone => (
              <Marker
                key={zone.id}
                position={[zone.lat, zone.lng]}
                icon={createEnergyIcon(zone)}
              >
                <Popup className="energy-popup" closeButton={false}>
                  <EnergyZonePopup zone={zone} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute top-3 right-3 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-lg">
          <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
            {(Object.entries(ENERGY_CONFIG) as [EnergyType, typeof ENERGY_CONFIG[EnergyType]][]).map(([type, config]) => (
              <span key={type} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: config.color }} />
                {config.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Energy summary strip */}
      {zones.length > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {zones.slice(0, 4).map(zone => {
              const config = ENERGY_CONFIG[zone.energy];
              return (
                <div
                  key={zone.id}
                  className="flex items-center gap-1.5 shrink-0 rounded-full border px-2.5 py-1.5 text-xs"
                  style={{ borderColor: `${config.color}33`, background: `${config.color}0a` }}
                >
                  <span>{zone.topEmoji}</span>
                  <span className="font-medium text-foreground truncate max-w-20">{zone.name}</span>
                  <span className="font-bold text-[10px]" style={{ color: config.color }}>{zone.intensity}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
