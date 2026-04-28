import { useQuery } from '@tanstack/react-query';
import { Bookmark, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BUCKET_LIST_TASKS } from '@/lib/bucket-list-tasks';
import { Progress } from '@/components/ui/progress';

interface Props {
  userId: string | undefined;
}

export function SavedPlansSection({ userId }: Props) {
  const { data: progress = [], isLoading } = useQuery({
    queryKey: ['profile-bucket-list', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('bucket_list_progress')
        .select('task_key, completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const completedKeys = new Set(progress.map((p: any) => p.task_key));
  const pct = Math.round((completedKeys.size / BUCKET_LIST_TASKS.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Bookmark className="h-4 w-4 text-primary" /> Wrigleyville Bucket List
        </div>
        <span className="text-xs text-muted-foreground">
          {completedKeys.size}/{BUCKET_LIST_TASKS.length}
        </span>
      </div>

      <Progress value={pct} className="h-2" />

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {BUCKET_LIST_TASKS.map((task) => {
            const done = completedKeys.has(task.key);
            return (
              <div
                key={task.key}
                className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
                  done ? 'border-primary/30 bg-primary/5' : 'bg-card/60 opacity-70'
                }`}
              >
                <span className="text-lg">{task.emoji}</span>
                <span
                  className={`flex-1 text-sm ${
                    done ? 'font-semibold' : 'text-destructive-foreground'
                  }`}
                >
                  {task.title}
                </span>
                {done && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
