import { Link } from 'react-router-dom';
import { Calendar, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

function useNextGame() {
  return useQuery({
    queryKey: ['next-cubs-game'],
    queryFn: async () => {
      const { data } = await supabase
        .from('games')
        .select('id, opponent, venue, game_start, is_home')
        .gte('game_start', new Date().toISOString())
        .order('game_start', { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function OffDayState() {
  const { data: next } = useNextGame();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">No game today</h2>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Off-day in Wrigleyville. The neighborhood doesn't sleep though.
        </p>

        {next && (
          <div className="mt-5 rounded-xl border border-border bg-background/60 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Next game
            </div>
            <div className="mt-1 font-display text-lg font-bold text-foreground">
              {next.is_home ? 'vs' : '@'} {next.opponent}
            </div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {format(new Date(next.game_start), 'EEE, MMM d · h:mm a')}
              {' · in '}
              {Math.max(0, differenceInDays(new Date(next.game_start), new Date()))} days
            </div>
          </div>
        )}
      </div>

      {/* Off-day actions */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          to="/meetups"
          className="rounded-xl border border-border bg-card p-3 text-center transition-colors hover:bg-muted/40"
        >
          <Sparkles className="mx-auto mb-1 h-4 w-4 text-primary" />
          <div className="text-[12px] font-bold text-foreground">Off-day meetup</div>
          <div className="text-[10px] text-muted-foreground">Plan something now</div>
        </Link>
        <Link
          to="/bar-map"
          className="rounded-xl border border-border bg-card p-3 text-center transition-colors hover:bg-muted/40"
        >
          <span className="mx-auto mb-1 block text-base"><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
          <div className="text-[12px] font-bold text-foreground">Bar guide</div>
          <div className="text-[10px] text-muted-foreground">Browse Wrigleyville</div>
        </Link>
      </div>
    </div>
  );
}
