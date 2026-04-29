import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BUCKET_LIST_TASKS } from '@/lib/bucket-list-tasks';
import { toast } from 'sonner';

export function useBucketList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const progressQuery = useQuery({
    queryKey: ['bucket-list', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bucket_list_progress')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const completedKeys = new Set(
    (progressQuery.data ?? []).map((p: any) => p.task_key)
  );

  const completeTask = useMutation({
    mutationFn: async (taskKey: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('bucket_list_progress')
        .insert({ user_id: user.id, task_key: taskKey });
      if (error) throw error;

      // Check if all tasks now complete
      const newCompleted = completedKeys.size + 1;
      if (newCompleted >= BUCKET_LIST_TASKS.length) {
        // Award Gameday Legend badge for 24h
        const legendUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase
          .from('profiles')
          .update({ gameday_legend_until: legendUntil } as any)
          .eq('user_id', user.id);
        
        // Award bonus Ivy Leaves
        await supabase.rpc('award_ivy_leaf', { _source: 'bucket_list_complete', _amount: 5 });
      }

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);
    },
    onSuccess: (_, taskKey) => {
      queryClient.invalidateQueries({ queryKey: ['bucket-list', user?.id] });
      const task = BUCKET_LIST_TASKS.find(t => t.key === taskKey);
      toast.success(`${task?.emoji ?? ''} ${task?.title ?? 'Task'} complete!`);
    },
    onError: () => toast.error('Failed to save progress'),
  });

  const uncompleteTask = useMutation({
    mutationFn: async (taskKey: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('bucket_list_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('task_key', taskKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket-list', user?.id] });
    },
  });

  const allComplete = completedKeys.size >= BUCKET_LIST_TASKS.length;

  return {
    tasks: BUCKET_LIST_TASKS,
    completedKeys,
    isLoading: progressQuery.isLoading,
    completeTask,
    uncompleteTask,
    allComplete,
    completedCount: completedKeys.size,
    totalCount: BUCKET_LIST_TASKS.length,
  };
}
