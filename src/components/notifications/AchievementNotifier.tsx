import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';

/** Mounts the achievement + leaderboard notification engine for signed-in users. */
export function AchievementNotifier() {
  useAchievementNotifications();
  return null;
}
