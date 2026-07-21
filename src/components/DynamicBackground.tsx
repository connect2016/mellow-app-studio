import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { PageBackground } from '@/components/PageBackground';
import bgWrigleyville from '@/assets/bg-wrigleyville-lofts.jpg'; // 1920x1080
import bgBarPatio from '@/assets/cubs-bar-patio.webp'; // 1732x1721
import bgPinball from '@/assets/bg-pinball.webp'; // 1368x1824
import bgOldstyle from '@/assets/bg-oldstyle.webp'; // 1440x1920
import bgField from '@/assets/bg-field.webp'; // 1920x1080
import bgBar from '@/assets/bg-bar.webp'; // 1920x1440
import bgPlayball from '@/assets/bg-wrigley-playball.webp'; // 1920x1440
import bgFansParade from '@/assets/cubs-fans-parade.webp'; // 1920x1279
import bgFansCelebrating from '@/assets/bg-cubs-fans-celebrating.webp'; // 1920x1171
import bgRainbow from '@/assets/bg-wrigleyville-street.webp'; // 1843x1114
import bgBarInterior from '@/assets/cubs-bar-interior.webp'; // 1920x1280
import bgMeetupsBright from '@/assets/meetups-bright.jpg';
import bgProfileBright from '@/assets/profile-bright.jpg';

// Only high-resolution sources (≥1400px on the long edge) so they stay crisp
// at 2x–3x mobile device pixel densities.
const ALL_IMAGES = [bgWrigleyville, bgPinball, bgOldstyle, bgField, bgBar, bgPlayball, bgFansParade, bgFansCelebrating, bgRainbow, bgBarInterior];

// Deterministic mapping for main tabs so consecutive tabs never share an image
const ROUTE_IMAGE_MAP: Record<string, string> = {
  '/discover-fans': bgBarPatio,
  '/vibe': bgField,
  '/hi-fives': bgFansCelebrating,
  '/profile': bgProfileBright,
  '/messages': bgPinball,
  '/settings': bgOldstyle,
  '/crews': bgBar,
  '/gameday': bgPlayball,
  '/meetups': bgMeetupsBright,
  '/missions': bgRainbow,
  '/onboarding': bgWrigleyville,
  '/check-in': bgBar,
  '/beer-money': bgOldstyle,
  '/': bgWrigleyville,
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
