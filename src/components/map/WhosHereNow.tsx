import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BarCheckin } from '@/hooks/useBarCheckins';

interface UserInfo {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
}

export function WhosHereNow({ checkins }: { checkins: BarCheckin[] }) {
  const [users, setUsers] = useState<UserInfo[]>([]);

  useEffect(() => {
    if (!checkins.length) {
      setUsers([]);
      return;
    }
    const userIds = checkins.map(c => c.user_id);
    supabase
      .rpc('get_public_profiles', { p_user_ids: userIds, p_limit: 50 })
      .then(({ data }) => {
        setUsers(
          (data || []).map((p: any) => ({
            user_id: p.user_id,
            display_name: p.display_name,
            profile_photo: p.profile_photo,
          }))
        );
      });
  }, [checkins]);

  if (!users.length) return null;

  return (
    <div className="mb-4">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Who's Here Now · {users.length}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {users.map((u) => (
          <div key={u.user_id} className="flex flex-col items-center gap-1 min-w-[52px]">
            <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-muted">
              {u.profile_photo ? (
                <img
                  src={u.profile_photo}
                  alt={u.display_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {u.display_name?.[0] || '?'}
                </div>
              )}
            </div>
            <span className="text-[9px] text-muted-foreground font-medium truncate max-w-[52px]">
              {u.display_name?.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
