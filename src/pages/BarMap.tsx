import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { WRIGLEYVILLE_BARS } from '@/types';

const WRIGLEY_CENTER: [number, number] = [41.9484, -87.6553];

// Coordinates for every bar in the list
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

function createPinIcon(color: 'blue' | 'red') {
  const fill = color === 'blue' ? '#1e40af' : '#dc2626';
  const stroke = color === 'blue' ? '#3b82f6' : '#f87171';
  return L.divIcon({
    html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
    </svg>`,
    className: 'custom-pin-marker',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

const bluePin = createPinIcon('blue');
const redPin = createPinIcon('red');

function getDirectionsUrl(lat: number, lng: number, name: string) {
  // Works on both iOS (Apple Maps) and Android (Google Maps)
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=walking`;
}

export default function BarMap() {
  const bars = useMemo(() => {
    return WRIGLEYVILLE_BARS.map((bar) => {
      const coords = BAR_LOCATIONS[bar.name];
      if (!coords) return null;
      return { ...bar, ...coords };
    }).filter(Boolean) as Array<typeof WRIGLEYVILLE_BARS[0] & { lat: number; lng: number; type: string }>;
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Wrigleyville Bar Map
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {bars.length} bars plotted · Tap a pin for details
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-[#1e40af]" /> Bars
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-[#dc2626]" /> Landmarks
            </span>
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

            {/* Wrigley Field marker */}
            <Marker position={WRIGLEY_CENTER} icon={redPin}>
              <Popup>
                <div className="text-center min-w-[180px]">
                  <p className="font-bold text-sm">🏟️ Wrigley Field</p>
                  <p className="text-xs text-gray-500 mt-0.5">1060 W Addison St</p>
                  <a
                    href={getDirectionsUrl(WRIGLEY_CENTER[0], WRIGLEY_CENTER[1], 'Wrigley Field')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
                    Get Directions
                  </a>
                </div>
              </Popup>
            </Marker>

            {/* Bar markers */}
            {bars.map((bar) => (
              <Marker
                key={bar.id}
                position={[bar.lat, bar.lng]}
                icon={bar.type === 'landmark' ? redPin : bluePin}
              >
                <Popup>
                  <div className="text-center min-w-[180px]">
                    <p className="font-bold text-sm">{bar.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{bar.address}</p>
                    <a
                      href={getDirectionsUrl(bar.lat, bar.lng, bar.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
                      Get Directions
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
