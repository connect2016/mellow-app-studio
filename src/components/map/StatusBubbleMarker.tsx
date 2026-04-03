import L from 'leaflet';
import { Marker } from 'react-leaflet';
import type { MapFan } from './useMapClusters';

const PERSONA_COLORS: Record<string, string> = {
  die_hard: '#dc2626',
  social_butterfly: '#f59e0b',
  tourist: '#0ea5e9',
};

const PERSONA_EMOJI: Record<string, string> = {
  die_hard: '🔥',
  social_butterfly: '🦋',
  tourist: '📸',
};

function fanIcon(fan: MapFan) {
  const photoUrl = fan.photo || '';
  const hasPhoto = !!fan.photo;
  const personaColor = fan.persona ? PERSONA_COLORS[fan.persona] : null;
  const personaEmoji = fan.persona ? PERSONA_EMOJI[fan.persona] : null;
  const borderColor = personaColor || '#3b82f6';
  const showPulse = fan.isRecentlyActive;

  const size = 42;
  const totalH = personaEmoji ? size + 18 : size;

  return L.divIcon({
    html: `
      <div style="position:relative;width:${size + 12}px;height:${totalH + 6}px;">
        ${showPulse ? `
        <!-- Active pulse ring -->
        <div class="map-active-pulse" style="
          position:absolute;
          top:3px; left:50%; transform:translateX(-50%);
          width:${size + 8}px; height:${size + 8}px;
          border-radius:50%;
          border:2px solid rgba(59,130,246,0.5);
        "></div>` : ''}
        <!-- Avatar circle -->
        <div style="
          position:absolute;
          top:${showPulse ? 7 : 3}px; left:50%; transform:translateX(-50%);
          width:${size}px; height:${size}px;
          border-radius:50%;
          border:3px solid ${borderColor};
          box-shadow:0 2px 10px rgba(0,0,0,0.25);
          overflow:hidden;
          background:#1e293b;
          display:flex; align-items:center; justify-content:center;
        ">
          ${hasPhoto
            ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" />`
            : `<span style="color:white;font-size:16px;font-weight:700;">${fan.name?.charAt(0) ?? '?'}</span>`
          }
        </div>
        ${personaEmoji ? `
        <!-- Persona chip -->
        <div style="
          position:absolute;
          bottom:0; left:50%; transform:translateX(-50%);
          background:${personaColor};
          border-radius:10px;
          padding:1px 5px;
          font-size:11px;
          line-height:16px;
          white-space:nowrap;
          box-shadow:0 1px 4px rgba(0,0,0,0.25);
          z-index:3;
        ">${personaEmoji}</div>` : ''}
      </div>
    `,
    className: 'photo-marker',
    iconSize: [size + 12, totalH + 6],
    iconAnchor: [(size + 12) / 2, totalH + 6],
  });
}

interface Props {
  fan: MapFan;
  onTap: (fan: MapFan) => void;
}

export function StatusBubbleMarker({ fan, onTap }: Props) {
  return (
    <Marker
      position={[fan.lat, fan.lng]}
      icon={fanIcon(fan)}
      eventHandlers={{
        click: () => onTap(fan),
      }}
    />
  );
}
