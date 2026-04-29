import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Beer, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export function CrewAtBarNotification() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: crewActivity } = useQuery({
    queryKey: ['crew-at-bar', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get user's crews
      const { data: memberships } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', user.id);

      if (!memberships || memberships.length === 0) return null;

      const crewIds = memberships.map(m => m.crew_id);

      // Get crew members who are active at bars
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      const { data: crewMembers } = await supabase
        .from('crew_members')
        .select('user_id, crew_id')
        .in('crew_id', crewIds)
        .neq('user_id', user.id);

      if (!crewMembers || crewMembers.length === 0) return null;

      const memberIds = crewMembers.map(m => m.user_id);

      const { data: activeMembers } = await supabase.rpc('get_public_profiles', {
        p_user_ids: memberIds,
        p_game_status: 'AtBar',
        p_active_since: sixHoursAgo,
      });

      if (!activeMembers || activeMembers.length === 0) return null;

      // Group by bar
      const barGroups: Record<string, { names: string[]; count: number }> = {};
      activeMembers.forEach(m => {
        const bar = m.wrigleyville_bar || 'a bar';
        if (!barGroups[bar]) barGroups[bar] = { names: [], count: 0 };
        barGroups[bar].names.push(m.display_name);
        barGroups[bar].count++;
      });

      const topBar = Object.entries(barGroups).sort((a, b) => b[1].count - a[1].count)[0];

      return {
        barName: topBar[0],
        names: topBar[1].names,
        count: topBar[1].count,
      };
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  if (!crewActivity) return null;

  const displayNames = crewActivity.names.slice(0, 2).join(' & ');
  const extra = crewActivity.count - 2;

  return (
    <button
      onClick={() => navigate('/venues')}
      className="w-full rounded-2xl border border-secondary/30 bg-secondary/5 p-4 text-left transition-all hover:bg-secondary/10"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
          <Beer className="h-5 w-5 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            Your crew is at {crewActivity.barName}! <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {displayNames}{extra > 0 ? ` +${extra} more` : ''} checked in
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </button>
  );
}
