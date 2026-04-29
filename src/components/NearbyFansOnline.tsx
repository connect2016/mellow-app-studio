import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export function NearbyFansOnline() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['nearby-fans-online'],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      const { data: active } = await supabase.rpc('get_public_profiles', {
        p_only_onboarded: true,
        p_active_since: sixHoursAgo,
        p_limit: 200,
      });

      const total = active?.length ?? 0;
      const atBars = active?.filter(p => p.game_status === 'AtBar').length ?? 0;
      const atWrigley = active?.filter(p => p.game_status === 'AtWrigley').length ?? 0;

      // Find most popular bar
      const barCounts: Record<string, number> = {};
      active?.forEach(p => {
        if (p.wrigleyville_bar && p.game_status === 'AtBar') {
          barCounts[p.wrigleyville_bar] = (barCounts[p.wrigleyville_bar] || 0) + 1;
        }
      });
      const topBar = Object.entries(barCounts).sort((a, b) => b[1] - a[1])[0];

      return { total, atBars, atWrigley, topBar: topBar ? { name: topBar[0], count: topBar[1] } : null };
    },
    refetchInterval: 20000,
    enabled: !!user,
  });

  if (!data || data.total === 0) return null;

  return (
    <button
      onClick={() => navigate('/discover')}
      className="w-full rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-4 text-left transition-all hover:border-primary/30"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          <Users className="h-4 w-4 text-primary" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fans Nearby</span>
      </div>

      <p className="text-lg font-bold text-foreground">
        {data.total} {data.total === 1 ? 'Buddy' : 'Buddies'} active
      </p>

      <div className="flex flex-wrap gap-2 mt-2">
        {data.atWrigley > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
             {data.atWrigley} at Wrigley
          </span>
        )}
        {data.atBars > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-medium text-secondary">
             {data.atBars} at bars
          </span>
        )}
        {data.topBar && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
            <MapPin className="h-3 w-3" /> {data.topBar.count} at {data.topBar.name}
          </span>
        )}
      </div>
    </button>
  );
}
