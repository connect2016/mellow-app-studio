import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface Member {
  user_id: string;
  location_label: string;
  profile?: {
    display_name: string;
    profile_photo: string | null;
    game_status: string | null;
    wrigley_section: string | null;
    wrigleyville_bar: string | null;
  };
}

const STATUS_ICON: Record<string, string> = {
  AtWrigley: '🏟️',
  AtBar: '🍻',
  WatchingRemote: '📺',
};

export function SessionMembers({ members }: { members: Member[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Who's Watching Where</span>
        <span className="ml-auto text-xs text-muted-foreground">{members.length} fan{members.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-2">
        {members.map((m, i) => {
          const status = m.profile?.game_status ?? '';
          const locationDetail = status === 'AtWrigley' && m.profile?.wrigley_section
            ? `At Wrigley – Section ${m.profile.wrigley_section}`
            : status === 'AtBar' && m.profile?.wrigleyville_bar
              ? `At ${m.profile.wrigleyville_bar}`
              : status === 'WatchingRemote'
                ? 'Watching from home'
                : m.location_label;
          return (
            <motion.div
              key={m.user_id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <div className="h-9 w-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
                {m.profile?.profile_photo ? (
                  <img src={m.profile.profile_photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {m.profile?.display_name?.charAt(0) ?? '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.profile?.display_name ?? 'Fan'}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span>{STATUS_ICON[status] ?? '📍'}</span>
                  {locationDetail}
                </p>
              </div>
              <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
