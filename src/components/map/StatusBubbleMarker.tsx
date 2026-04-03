import L from 'leaflet';
import { Marker } from 'react-leaflet';
import type { MapFan } from './useMapClusters';

const STATUS_BUBBLES: Record<string, { emoji: string; label: string }> = {
  AtBar: { emoji: '🍺', label: 'Grabbing a Brew' },
  AtWrigley: { emoji: '⚾️', label: 'Scorekeeping' },
  Tailgating: { emoji: '🌭', label: 'At the Concessions' },
  BeerSnake: { emoji: '👋', label: 'Just Saying Hey' },
  WatchingRemote: { emoji: '👋', label: 'Just Saying Hey' },
};

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
  const status = STATUS_BUBBLES[fan.gameStatus] ?? { emoji: '👋', label: 'Just Saying Hey' };
  const photoUrl = fan.photo || '';
  const hasPhoto = !!fan.photo;
  const personaColor = fan.persona ? PERSONA_COLORS[fan.persona] : null;
  const personaEmoji = fan.persona ? PERSONA_EMOJI[fan.persona] : null;
  const borderColor = personaColor || 'white';

  return L.divIcon({
    html: `
      <div style="position:relative;width:44px;height:${personaEmoji ? '72' : '56'}px;">
        <!-- Status bubble -->
        <div style="
          position:absolute;
          top:0; left:50%; transform:translateX(-50%);
          background:hsl(40, 15%, 88%);
          border:1.5px solid hsl(160, 52%, 15%, 0.25);
          border-radius:12px;
          padding:1px 5px;
          font-size:12px;
          line-height:16px;
          white-space:nowrap;
          box-shadow:0 1px 4px rgba(0,0,0,0.15);
          z-index:2;
        ">${status.emoji}</div>
        <!-- Avatar -->
        <div style="
          position:absolute;
          ${personaEmoji ? 'bottom:16px;' : 'bottom:0;'}
          left:50%; transform:translateX(-50%);
          width:32px; height:32px;
          border-radius:50%;
          border:2.5px solid ${borderColor};
          box-shadow:0 2px 8px rgba(0,0,0,0.2);
          overflow:hidden;
          background:hsl(160, 52%, 15%);
          display:flex; align-items:center; justify-content:center;
        ">
          ${hasPhoto
            ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" />`
            : `<span style="color:white;font-size:13px;font-weight:700;">${fan.name?.charAt(0) ?? '?'}</span>`
          }
        </div>
        ${personaEmoji ? `
        <!-- Persona badge -->
        <div style="
          position:absolute;
          bottom:0; left:50%; transform:translateX(-50%);
          background:${personaColor};
          border-radius:8px;
          padding:1px 4px;
          font-size:10px;
          line-height:14px;
          white-space:nowrap;
          box-shadow:0 1px 3px rgba(0,0,0,0.2);
          z-index:3;
        ">${personaEmoji}</div>` : ''}
      </div>
    `,
    className: 'emoji-marker',
    iconSize: [44, personaEmoji ? 72 : 56],
    iconAnchor: [22, personaEmoji ? 72 : 56],
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
