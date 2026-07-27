import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useCrowdEnergy, type EnergyType } from '@/hooks/useCrowdEnergy';
import { Zap } from 'lucide-react';
import { ENERGY_CONFIG, EnergyZoneLayers } from '@/components/map/EnergyZoneLayers';

const WRIGLEY_CENTER: [number, number] = [41.9484, -87.6553];

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

            <EnergyZoneLayers zones={zones} />
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
