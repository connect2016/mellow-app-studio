import { useState, useMemo } from 'react';
import { StickyGameHeader } from './StickyGameHeader';
import { BestVibesTonight } from './BestVibesTonight';
import { LiveMeetupsStrip } from './LiveMeetupsStrip';
import { MapPreviewCard } from './MapPreviewCard';
import { DrinkSpecialsStrip } from './DrinkSpecialsStrip';
import { SocialPhotoFeed } from './SocialPhotoFeed';
import { CreateMeetupModal } from '@/components/lineup/CreateMeetupModal';
import { useProfile } from '@/hooks/useProfile';

type Intent = 'watch_game' | 'meet_fans' | 'bar_hop' | 'date';

// Module ordering by primary intent — surfaces what matters most for each user.
const ORDER_BY_INTENT: Record<Intent, string[]> = {
  watch_game: ['game', 'meetups', 'photos', 'vibes', 'map', 'specials'],
  meet_fans: ['meetups', 'map', 'vibes', 'game', 'photos', 'specials'],
  bar_hop: ['vibes', 'specials', 'map', 'meetups', 'game', 'photos'],
  date: ['meetups', 'vibes', 'photos', 'specials', 'map', 'game'],
};
const DEFAULT_ORDER = ['game', 'vibes', 'meetups', 'map', 'specials', 'photos'];

export function HomeDashboard() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: profile } = useProfile();

  const order = useMemo(() => {
    const intent = (profile?.quick_start as { primary_intent?: Intent } | null)?.primary_intent;
    return intent && ORDER_BY_INTENT[intent] ? ORDER_BY_INTENT[intent] : DEFAULT_ORDER;
  }, [profile?.quick_start]);

  const modules: Record<string, JSX.Element> = {
    game: <StickyGameHeader key="game" />,
    vibes: <BestVibesTonight key="vibes" />,
    meetups: <LiveMeetupsStrip key="meetups" onCreate={() => setShowCreate(true)} />,
    map: <MapPreviewCard key="map" />,
    specials: <DrinkSpecialsStrip key="specials" />,
    photos: <SocialPhotoFeed key="photos" />,
  };

  return (
    <div className="mb-2">
      {order.map((id) => modules[id])}
      <CreateMeetupModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
