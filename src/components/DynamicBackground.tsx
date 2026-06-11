import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import bgWrigleyville from '@/assets/bg-wrigleyville-lofts.jpg';
import bgBarPatio from '@/assets/cubs-bar-patio.webp';
import bgPinball from '@/assets/bg-pinball.webp';
import bgOldstyle from '@/assets/bg-oldstyle.webp';
import bgConcourse from '@/assets/bg-concourse.jpg';
// bg-rizzo removed: avoided player-likeness exposure
import bgField from '@/assets/bg-field.webp';
import bgSeats from '@/assets/bg-seats.webp';
import bgBar from '@/assets/bg-bar.webp';
import bgPatio from '@/assets/bg-patio.webp';
import bgBleachers from '@/assets/bg-bleachers.webp';

const ALL_IMAGES = [bgWrigleyville, bgPinball, bgOldstyle, bgConcourse, bgBleachers, bgField, bgSeats, bgBar, bgPatio, bgBleachers];

// Deterministic mapping for main tabs so consecutive tabs never share an image
const ROUTE_IMAGE_MAP: Record<string, string> = {
  '/discover': bgBarPatio,
  '/vibe': bgField,
  '/hi-fives': bgBleachers,
  '/profile': bgSeats,
  '/messages': bgPinball,
  '/settings': bgOldstyle,
  '/crews': bgBar,
  '/gameday': bgPatio,
  '/missions': bgBleachers,
  '/onboarding': bgConcourse,
  '/check-in': bgBar,
  '/beer-money': bgOldstyle,
  '/': bgConcourse,
};

function getImageForRoute(pathname: string): string {
  // Exact match first
  if (ROUTE_IMAGE_MAP[pathname]) return ROUTE_IMAGE_MAP[pathname];
  // Prefix match (e.g. /profile/123)
  for (const [route, img] of Object.entries(ROUTE_IMAGE_MAP)) {
    if (pathname.startsWith(route)) return img;
  }
  // Deterministic pseudo-random for other routes
  let hash = 0;
  for (let i = 0; i < pathname.length; i++) {
    hash = ((hash << 5) - hash + pathname.charCodeAt(i)) | 0;
  }
  return ALL_IMAGES[Math.abs(hash) % ALL_IMAGES.length];
}

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function DynamicBackground({ children, className = '' }: Props) {
  const { pathname } = useLocation();
  const bgImage = useMemo(() => getImageForRoute(pathname), [pathname]);

  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Background image layer */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Light white overlay to soften photos and improve text legibility */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'rgba(255, 255, 255, 0.15)' }}
      />
      {/* Cinematic dark gradient overlay for text readability (top→bottom + center fade) */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, hsla(222, 47%, 6%, 0.55) 0%, hsla(222, 47%, 8%, 0.35) 35%, hsla(222, 47%, 8%, 0.40) 65%, hsla(222, 47%, 6%, 0.60) 100%)',
        }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
