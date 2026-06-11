import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { SEOMeta } from '@/components/SEOMeta';
import { AppHeader } from '@/components/AppHeader';
import { WrigleyRainbowBackground } from '@/components/WrigleyRainbowBackground';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { NearbyFansSheet } from '@/components/map/NearbyFansSheet';
import { useFanMapPins, deriveGate, type GateFilter, GATE_OPTIONS } from '@/hooks/useFanMapPins';
import { BuyBeerModal } from '@/components/beer/BuyBeerModal';
import { supabase } from '@/integrations/supabase/client';
import type { MapFan } from '@/components/map/useMapClusters';

const WRIGLEY_CENTER: [number, number] = [41.9484, -87.6553];

function FitToFans({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [60, 60], maxZoom: 16 });
    }
  }, [positions, map]);
  return null;
}

function fanPinIcon(fan: MapFan, dimmed: boolean) {
  const size = 24;
  const hasPhoto = !!fan.photo;
  const opacity = dimmed ? 0.3 : 1;
  return L.divIcon({
    html: `
      <div style="opacity:${opacity};width:${size}px;height:${size}px;border-radius:50%;border:2px solid hsl(var(--brand-navy));background:hsl(var(--brand-navy));display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.25)">
        ${hasPhoto
          ? `<img src="${fan.photo}" style="width:100%;height:100%;object-fit:cover" loading="lazy" decoding="async" />`
          : `<span style="color:white;font-size:11px;font-weight:700">${(fan.name?.charAt(0) ?? '?').toUpperCase()}</span>`
        }
      </div>
    `,
    className: 'fan-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function FanMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fans } = useFanMapPins();
  const [selectedGate, setSelectedGate] = useState<GateFilter | null>(null);
  const [popupFan, setPopupFan] = useState<MapFan | null>(null);
  const [beerFor, setBeerFor] = useState<MapFan | null>(null);

  // Decorate fans with derived gate
  const fansWithGate = useMemo(
    () => fans.map((f) => ({ ...f, gate: deriveGate((f as any)._section ?? f.locationLabel) })),
    [fans]
  );

  const filteredFans = useMemo(
    () => (selectedGate ? fansWithGate.filter((f) => f.gate === selectedGate) : fansWithGate),
    [fansWithGate, selectedGate]
  );

  const gateCounts = useMemo(() => {
    const counts: Partial<Record<GateFilter, number>> = {};
    for (const g of GATE_OPTIONS) counts[g] = 0;
    for (const f of fansWithGate) {
      if (f.gate) counts[f.gate] = (counts[f.gate] ?? 0) + 1;
    }
    return counts;
  }, [fansWithGate]);

  const allPositions = useMemo<[number, number][]>(
    () => [WRIGLEY_CENTER, ...fansWithGate.map((f) => [f.lat, f.lng] as [number, number])],
    [fansWithGate]
  );

  const handleSayHi = async (fan: MapFan) => {
    if (!user) {
      toast.error('Sign in to say hi');
      return;
    }
    try {
      const { data, error } = await supabase.rpc('say_hi_to_buddy', { p_recipient_id: fan.id });
      if (error) throw error;
      const result = (data as any)?.result;
      const convId = (data as any)?.conversation_id;
      if (result === 'sent') toast.success(`Said hi to ${fan.name}`);
      else if (result === 'accepted') {
        toast.success(`You and ${fan.name} are connected!`);
        if (convId) navigate(`/messages?c=${convId}`);
      } else if (result === 'already_connected') {
        if (convId) navigate(`/messages?c=${convId}`);
      } else if (result === 'already_sent') {
        toast.info('Already said hi — waiting for them.');
      }
      setPopupFan(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to say hi');
    }
  };

  return (
    <WrigleyRainbowBackground>
    <div className="relative min-h-screen">
      <SEOMeta
        title="Fan Map — Wrigleyville Buddies"
        description="See nearby Cubs fans on the live map and say hi from your seat."
      />
      <AppHeader />

      {/* Full-bleed map under header */}
      <div className="fixed inset-0 top-14 bottom-0 z-0">
        <MapContainer
          center={WRIGLEY_CENTER}
          zoom={15}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OSM'
          />
          <FitToFans positions={allPositions} />
          {fansWithGate.map((fan) => {
            const dimmed = !!selectedGate && fan.gate !== selectedGate;
            return (
              <Marker
                key={fan.id}
                position={[fan.lat, fan.lng]}
                icon={fanPinIcon(fan, dimmed)}
                eventHandlers={{ click: () => setPopupFan(fan) }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* Mini popup card for tapped pin */}
      {popupFan && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/30"
            onClick={() => setPopupFan(null)}
          />
          <div className="fixed left-1/2 -translate-x-1/2 top-24 z-40 w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-background border border-border shadow-lg p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[hsl(var(--brand-navy))] text-white flex items-center justify-center overflow-hidden font-bold">
                {popupFan.photo
                  ? <img src={popupFan.photo} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  : (popupFan.name?.charAt(0) ?? '?')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{popupFan.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {(popupFan as any).gate ?? popupFan.locationLabel}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleSayHi(popupFan)}
                className="flex-1 min-h-[44px] rounded-xl bg-[hsl(var(--brand-navy))] text-white text-sm font-bold"
              >
                Say Hi
              </button>
              <button
                onClick={() => { setBeerFor(popupFan); setPopupFan(null); }}
                className="min-h-[44px] px-4 rounded-xl bg-amber-500 text-amber-950 text-sm font-bold"
              >
                Buy a beer
              </button>
            </div>
          </div>
        </>
      )}

      {/* Nearby fans bottom sheet */}
      <NearbyFansSheet
        fans={filteredFans}
        totalCount={fansWithGate.length}
        selectedGate={selectedGate}
        onSelectGate={setSelectedGate}
        gateCounts={gateCounts}
        onSayHi={handleSayHi}
        onBuyBeer={(f) => setBeerFor(f)}
      />

      {/* Buy beer modal */}
      {beerFor && (
        <BuyBeerModal
          open={!!beerFor}
          onOpenChange={(o) => !o && setBeerFor(null)}
          context={{
            kind: 'fan',
            userId: beerFor.id,
            firstName: beerFor.name?.split(' ')[0] ?? 'Fan',
            avatarUrl: beerFor.photo ?? undefined,
          }}
        />
      )}
    </div>
    </WrigleyRainbowBackground>
  );
}
