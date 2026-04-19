import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import type { ParticipatingBar } from '@/lib/wrigleyville-bar-coords';

const beerIcon = L.divIcon({
  className: 'bar-pin-icon',
  html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:16px;">🍺</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface Props {
  bar: ParticipatingBar;
}

export function BarLocationPreview({ bar }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="h-32 w-full">
        <MapContainer
          center={[bar.lat, bar.lng]}
          zoom={16}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <Marker position={[bar.lat, bar.lng]} icon={beerIcon} />
        </MapContainer>
      </div>
      <div className="flex items-start gap-2 p-2.5">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-foreground">{bar.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{bar.address}</p>
        </div>
      </div>
    </div>
  );
}
