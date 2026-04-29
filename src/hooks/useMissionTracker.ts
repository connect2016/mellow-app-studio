import { useCallback } from 'react';
import { useIncrementMission } from '@/hooks/useMissions';
import { toast } from 'sonner';

/**
 * Hook that provides mission-tracking callbacks.
 * Call these after relevant user actions to auto-progress missions.
 */
export function useMissionTracker() {
  const increment = useIncrementMission();

  const track = useCallback(async (missionKey: string) => {
    try {
      const result = await increment.mutateAsync({ missionKey });
      if (result?.justCompleted) {
        toast(`Mission complete: ${result.mission.title}! Tap to claim your reward.`, {
          action: {
            label: 'View Missions',
            onClick: () => window.location.assign('/missions'),
          },
        });
      }
    } catch {
      // Silent fail — mission tracking shouldn't block UX
    }
  }, [increment]);

  return {
    trackCheckInWrigley: () => track('check_in_wrigley'),
    trackCheckInBar: () => track('check_in_bar'),
    trackJoinMeetup: () => track('join_meetup'),
    trackBuyDrink: () => track('buy_a_drink'),
    trackHiFive: () => track('hi_five_3'),
    trackJoinCrew: () => track('first_crew'),
    trackShareVibe: () => track('share_vibe'),
    trackBeerSnake: () => track('beer_snake'),
    trackMatch: () => track('match_3'),
    trackAttendGame: () => track('attend_5_games'),
  };
}
