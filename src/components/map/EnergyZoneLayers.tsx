import { motion } from 'framer-motion';
import { Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { type EnergyZone, type EnergyType } from '@/hooks/useCrowdEnergy';
import { Users, Flame, PartyPopper, Coffee, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export const ENERGY_CONFIG: Record<EnergyType, {
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

export function createEnergyIcon(zone: EnergyZone) {
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

export function EnergyZonePopup({ zone }: { zone: EnergyZone }) {
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
                  <img src={f.profile_photo} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
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

/**
 * Zone Circle + Marker + Popup layers only — renders as children of an
 * existing MapContainer. Does not render its own MapContainer/TileLayer.
 */
export function EnergyZoneLayers({ zones }: { zones: EnergyZone[] }) {
  return (
    <>
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
    </>
  );
}
