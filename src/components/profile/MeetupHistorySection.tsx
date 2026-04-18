import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { History, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  userId: string | undefined;
}

export function MeetupHistorySection({ userId }: Props) {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['profile-meetup-history', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: members, error } = await supabase
        .from('lineup_members')
        .select('meetup_id, joined_at, lineup_meetups(id, location_name, meeting_time, status)')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (members ?? []).filter((m: any) => m.lineup_meetups);
    },
    enabled: !!userId,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <History className="h-4 w-4 text-primary" /> Meetup History
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border bg-card/60 p-4 text-center text-sm text-muted-foreground">
          No meetups joined yet
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((m: any) => {
            const meetup = m.lineup_meetups;
            return (
              <button
                key={m.meetup_id}
                onClick={() => navigate(`/meetups/${m.meetup_id}`)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card/80 p-3 text-left transition hover:bg-card"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{meetup.location_name}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(m.joined_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    meetup.status === 'active'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {meetup.status}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
