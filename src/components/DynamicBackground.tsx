import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { PageBackground } from '@/components/PageBackground';
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
    <PageBackground image={bgImage} className={className}>
      {children}
    </PageBackground>
  );
}
