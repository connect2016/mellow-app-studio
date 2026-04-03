import { useGamePhase } from '@/hooks/useGamePhase';
import { WrigleyCountdownClock } from '@/components/WrigleyCountdownClock';
import { WhosNearbyCarousel } from '@/components/WhosNearbyCarousel';
import { OffDayFlashback } from '@/components/OffDayFlashback';

export function GamedayStateHero() {
  const { data: gamePhase, isLoading } = useGamePhase();

  if (isLoading) return null;

  const isGameday = gamePhase?.phase === 'pre-game' || gamePhase?.phase === 'mid-game' || gamePhase?.phase === 'post-game';

  if (isGameday) {
    return (
      <div className="space-y-3">
        <WrigleyCountdownClock />
        <WhosNearbyCarousel />
      </div>
    );
  }

  // Off-day
  return <OffDayFlashback />;
}
