import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface NearbyFan {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
  game_status: string | null;
  wrigley_section: string | null;
  wrigleyville_bar: string | null;
  vibe_emoji: string | null;
}

const STATUS_EMOJI: Record<string, string> = {
  AtWrigley: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />',
  AtBar: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />',
  Tailgating: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />',
  BeerSnake: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />',
  WatchingRemote: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />',
};

export function WhosNearbyCarousel() {
  const { user } = useAuth();

  const { data: fans = [] } = useQuery({
    queryKey: ['whos-nearby'],
    queryFn: async (): Promise<NearbyFan[]> => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.rpc('get_public_profiles', {
        p_exclude_ids: user?.id ? [user.id] : [],
        p_active_since: sixHoursAgo,
        p_limit: 20,
      });

      const filtered = (data ?? []).filter(
        (p: any) => ['AtWrigley', 'AtBar', 'Tailgating', 'BeerSnake'].includes(p.game_status ?? '')
      );
      return filtered as NearbyFan[];
    },
    refetchInterval: 20000,
    enabled: !!user,
  });

  if (fans.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 px-1">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <h3
          className="text-sm font-bold text-foreground tracking-tight"
          style={{ fontFamily: "'Rye', cursive" }}
        >
          Who's Nearby
        </h3>
        <span className="text-[10px] text-muted-foreground font-scoreboard">
          {fans.length} fan{fans.length !== 1 ? 's' : ''} active
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {fans.map((fan, i) => (
          <motion.div
            key={fan.user_id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[72px]"
          >
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-primary/30">
                <AvatarImage src={fan.profile_photo || undefined} />
                <AvatarFallback
                  className="text-sm font-bold"
                  style={{ background: 'hsl(var(--day-blue))', color: 'white' }}
                >
                  {fan.display_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              {/* Status badge */}
              <span className="absolute -bottom-0.5 -right-0.5 text-sm">
                {fan.vibe_emoji || STATUS_EMOJI[fan.game_status ?? ''] || '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />'}
              </span>
            </div>
            <div className="text-center min-w-0 w-full">
              <p className="text-[10px] font-semibold text-foreground truncate">
                {fan.display_name}
              </p>
              <p className="text-[8px] text-muted-foreground font-scoreboard truncate uppercase">
                {fan.game_status === 'AtWrigley' && fan.wrigley_section
                  ? `Sec ${fan.wrigley_section}`
                  : fan.game_status === 'AtBar' && fan.wrigleyville_bar
                  ? fan.wrigleyville_bar
                  : fan.game_status === 'Tailgating'
                  ? 'Tailgating'
                  : 'Nearby'}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
