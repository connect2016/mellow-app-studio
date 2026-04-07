import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Mission {
  id: string;
  key: string;
  title: string;
  description: string;
  emoji: string;
  category: string;
  target_count: number;
  points: number;
  badge_key: string | null;
  perk_description: string | null;
  is_daily: boolean;
  sort_order: number;
}

export interface MissionProgress {
  id: string;
  user_id: string;
  mission_id: string;
  current_count: number;
  completed: boolean;
  completed_at: string | null;
  reward_claimed: boolean;
  reset_date: string | null;
}

export interface MissionWithProgress extends Mission {
  progress: MissionProgress | null;
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export function useMissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['missions', user?.id],
    queryFn: async () => {
      const { data: missions, error } = await supabase
        .from('missions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;

      // Get user progress
      const { data: progress } = await supabase
        .from('mission_progress')
        .select('*')
        .eq('user_id', user!.id);

      const today = getTodayDate();

      return (missions ?? []).map((m) => {
        let userProgress: MissionProgress | null = null;

        if (m.is_daily) {
          // Find today's progress
          userProgress = (progress ?? []).find(
            (p) => p.mission_id === m.id && p.reset_date === today
          ) ?? null;
        } else {
          userProgress = (progress ?? []).find(
            (p) => p.mission_id === m.id && !p.reset_date
          ) ?? null;
        }

        return { ...m, progress: userProgress } as MissionWithProgress;
      });
    },
    enabled: !!user,
  });
}

export function useTotalPoints() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['total-points', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user!.id);

      return (data ?? []).reduce((sum, row) => sum + row.points, 0);
    },
    enabled: !!user,
  });
}

export function useIncrementMission() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ missionKey, increment = 1 }: { missionKey: string; increment?: number }) => {
      if (!user) throw new Error('Not authenticated');

      // Get mission definition
      const { data: mission } = await supabase
        .from('missions')
        .select('*')
        .eq('key', missionKey)
        .eq('is_active', true)
        .single();

      if (!mission) return null;

      const today = getTodayDate();
      const resetDate = mission.is_daily ? today : null;

      // Find or create progress
      const { data: existing } = await supabase
        .from('mission_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('mission_id', mission.id)
        .eq('reset_date', resetDate ?? '')
        .maybeSingle();

      if (existing?.completed) return { alreadyCompleted: true, mission };

      let newCount: number;

      if (existing) {
        newCount = Math.min(existing.current_count + increment, mission.target_count);
        const completed = newCount >= mission.target_count;
        await supabase
          .from('mission_progress')
          .update({
            current_count: newCount,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        newCount = Math.min(increment, mission.target_count);
        const completed = newCount >= mission.target_count;
        await supabase.from('mission_progress').insert({
          user_id: user.id,
          mission_id: mission.id,
          current_count: newCount,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          reset_date: resetDate,
        });
      }

      const justCompleted = newCount >= mission.target_count && !existing?.completed;
      return { justCompleted, mission, newCount };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}

export function useClaimReward() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ progressId, missionId, points, badgeKey }: {
      progressId: string;
      missionId: string;
      points: number;
      badgeKey: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Mark as claimed
      await supabase
        .from('mission_progress')
        .update({ reward_claimed: true })
        .eq('id', progressId);

      // Award points via secure server function
      await supabase.rpc('award_user_points', {
        _source: 'mission',
        _source_id: missionId,
        _points: Math.min(Math.max(points, 1), 100),
      });

      // Award badge if applicable
      if (badgeKey) {
        const { data: existing } = await supabase
          .from('user_pennants')
          .select('id')
          .eq('user_id', user.id)
          .eq('badge_key', badgeKey)
          .maybeSingle();

        if (!existing) {
          await supabase.from('user_pennants').insert({
            user_id: user.id,
            badge_key: badgeKey,
            target_count: 1,
            current_count: 1,
            unlocked: true,
            unlocked_at: new Date().toISOString(),
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['missions'] });
      qc.invalidateQueries({ queryKey: ['total-points'] });
      qc.invalidateQueries({ queryKey: ['pennants'] });
    },
  });
}
