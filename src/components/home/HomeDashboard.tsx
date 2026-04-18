import { useState } from 'react';
import { StickyGameHeader } from './StickyGameHeader';
import { BestVibesTonight } from './BestVibesTonight';
import { LiveMeetupsStrip } from './LiveMeetupsStrip';
import { MapPreviewCard } from './MapPreviewCard';
import { DrinkSpecialsStrip } from './DrinkSpecialsStrip';
import { SocialPhotoFeed } from './SocialPhotoFeed';
import { CreateMeetupModal } from '@/components/lineup/CreateMeetupModal';

export function HomeDashboard() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="mb-2">
      <StickyGameHeader />
      <BestVibesTonight />
      <LiveMeetupsStrip onCreate={() => setShowCreate(true)} />
      <MapPreviewCard />
      <DrinkSpecialsStrip />
      <SocialPhotoFeed />

      <CreateMeetupModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
