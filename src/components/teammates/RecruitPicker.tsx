/**
 * RecruitPicker — bottom-sheet fan browser for sending teammate (recruit) requests.
 * Lives on the Dugout page. Fetches all fans + the user's existing buddy_requests
 * in two queries, then resolves each row's state client-side (none / pending / accepted)
 * so we never fire a per-row status query.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Search, Check, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSendTeammateRequest } from '@/hooks/useTeammates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type RelStatus = 'pending' | 'accepted';

export function RecruitPicker() {
  const { user } = useAuth();
  const send = useSendTeammateRequest();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  // Locally track sends made while the sheet is open so buttons flip instantly.
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  // All browsable fans (onboarded, not banned/hidden — the RPC enforces that).
  const { data: fans, isLoading: fansLoading } = useQuery({
    queryKey: ['recruit-picker-fans', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_profiles', {
        p_exclude_ids: user ? [user.id] : null,
        p_only_onboarded: true,
        p_limit: 200,
      });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: open && !!user,
  });

  // Every pending/accepted relationship I'm part of, in one query.
  const { data: relationships } = useQuery({
    queryKey: ['recruit-picker-relationships', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('buddy_requests')
        .select('requester_id, recipient_id, status')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .in('status', ['pending', 'accepted']);
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && !!user,
  });

  const statusByUser = useMemo(() => {
    const map = new Map<string, RelStatus>();
    for (const r of relationships ?? []) {
      const otherId = r.requester_id === user?.id ? r.recipient_id : r.requester_id;
      // accepted always wins over pending if somehow both exist
      if (r.status === 'accepted' || !map.has(otherId)) {
        map.set(otherId, r.status as RelStatus);
      }
    }
    return map;
  }, [relationships, user?.id]);

  const visibleFans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (fans ?? []).filter(
      (f) => !q || (f.display_name ?? '').toLowerCase().includes(q)
    );
  }, [fans, search]);

  const handleRecruit = (fanId: string) => {
    setSentIds((prev) => new Set(prev).add(fanId));
    send.mutate(fanId);
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full rounded-2xl min-h-[48px] font-semibold bg-white text-[hsl(var(--brand-navy))] hover:bg-white/90 shadow-md">
          <UserPlus className="mr-2 h-5 w-5" /> Recruit Teammates
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 text-left">
          <SheetTitle className="text-[hsl(var(--brand-navy))]">Recruit Teammates</SheetTitle>
          <SheetDescription>Browse fans and invite them to your Dugout.</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fans by name…"
              className="pl-9 rounded-xl min-h-[44px]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {fansLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading fans…</p>
          ) : visibleFans.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {search ? 'No fans match that name.' : 'No fans to show yet.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleFans.map((fan) => {
                const status = statusByUser.get(fan.user_id);
                const justSent = sentIds.has(fan.user_id);
                return (
                  <li
                    key={fan.user_id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
                  >
                    {fan.profile_photo ? (
                      <img
                        src={fan.profile_photo}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-[hsl(var(--brand-navy))]/15 flex items-center justify-center text-lg">
                        ⚾
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[hsl(var(--brand-navy))] truncate">
                        {fan.display_name ?? 'A fan'}
                      </p>
                      {(fan.wrigleyville_bar || fan.gameday_persona) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {fan.wrigleyville_bar
                            ? `Usually at ${fan.wrigleyville_bar}`
                            : fan.gameday_persona}
                        </p>
                      )}
                    </div>
                    {status === 'accepted' ? (
                      <Button
                        disabled
                        variant="outline"
                        size="sm"
                        className="rounded-xl min-h-[40px] border-[hsl(var(--brand-navy))]/30 text-[hsl(var(--brand-navy))]"
                      >
                        <Check className="mr-1 h-4 w-4" /> Teammate
                      </Button>
                    ) : status === 'pending' || justSent ? (
                      <Button
                        disabled
                        variant="outline"
                        size="sm"
                        className="rounded-xl min-h-[40px] text-muted-foreground"
                      >
                        <Clock className="mr-1 h-4 w-4" /> Invited
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleRecruit(fan.user_id)}
                        className="rounded-xl min-h-[40px] font-semibold bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-deep))]"
                      >
                        <UserPlus className="mr-1 h-4 w-4" /> Recruit
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
