import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import bgWrigleyville from '@/assets/bg-wrigleyville-lofts.jpg';
import bgBarPatio from '@/assets/cubs-bar-patio.png';
import bgPinball from '@/assets/bg-pinball.jpg';
import bgOldstyle from '@/assets/bg-oldstyle.jpg';
import bgConcourse from '@/assets/bg-concourse.jpg';
import bgRizzo from '@/assets/bg-rizzo.jpg';
import bgField from '@/assets/bg-field.jpg';
import bgSeats from '@/assets/bg-seats.webp';
import bgBar from '@/assets/bg-bar.jpg';
import bgPatio from '@/assets/bg-patio.jpg';
import bgBleachers from '@/assets/bg-bleachers.jpg';

const ALL_IMAGES = [bgWrigleyville, bgPinball, bgOldstyle, bgConcourse, bgRizzo, bgField, bgSeats, bgBar, bgPatio, bgBleachers];

// Deterministic mapping for main tabs so consecutive tabs never share an image
const ROUTE_IMAGE_MAP: Record<string, string> = {
  '/discover': bgBarPatio,
  '/vibe': bgField,
  '/hi-fives': bgRizzo,
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
      {/* Dark blue overlay for readability */}
      <div
        className="fixed inset-0 z-0"
        style={{ backgroundColor: 'hsla(222, 47%, 11%, 0.25)' }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
