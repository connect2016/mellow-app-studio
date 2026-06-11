import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTeammates, useIncomingRequests, useRespondToRequest } from '@/hooks/useTeammates';
import { TeammateDeck } from '@/components/teammates/TeammateDeck';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, ArrowLeft, X, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export default function Dugout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: teammates, isLoading } = useTeammates();
  const { data: incoming } = useIncomingRequests();
  const respond = useRespondToRequest();

  // Look up requester display names for incoming requests
  const requesterIds = (incoming ?? []).map(r => r.requester_id);
  const { data: requesters } = useQuery({
    queryKey: ['teammate-requesters', requesterIds.join(',')],
    queryFn: async () => {
      if (requesterIds.length === 0) return [];
      const { data, error } = await supabase.rpc('get_public_profiles', {
        p_user_ids: requesterIds,
        p_limit: requesterIds.length,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: requesterIds.length > 0,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="px-6 pt-12 text-center">
          <p className="font-semibold text-foreground">Sign in to see your Dugout.</p>
          <Button className="mt-4 rounded-xl" onClick={() => navigate('/auth')}>Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background:
          'linear-gradient(180deg, #001a3d 0%, #002F6C 40%, #0a3a85 100%)',
      }}
    >
      <AppHeader />

      <div className="mx-auto max-w-lg px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 mb-3 text-sm text-white/80 hover:text-white min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Hero */}
        <div className="text-center mb-4">
          <h1
            className="font-display text-4xl font-extrabold text-white tracking-wide drop-shadow-lg"
            style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '2px' }}
          >
            THE DUGOUT
          </h1>
          <p className="text-sm text-white/85 mt-1 drop-shadow">
            Your roster of Teammates — flip through the cards.
          </p>
        </div>

        {/* Incoming requests */}
        {incoming && incoming.length > 0 && (
          <div className="mb-5 rounded-2xl border-2 border-[#C8102E] bg-white/95 p-3 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="h-5 w-5 text-[#C8102E]" />
              <h2 className="font-bold text-[#002F6C]">
                {incoming.length} Recruit Request{incoming.length === 1 ? '' : 's'}
              </h2>
            </div>
            <ul className="space-y-2">
              {incoming.map(req => {
                const r = (requesters as any[])?.find(p => p.user_id === req.requester_id);
                return (
                  <li key={req.id} className="flex items-center gap-2 rounded-xl bg-[#002F6C]/5 p-2">
                    {r?.profile_photo ? (
                      <img src={r.profile_photo} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[#002F6C]/20 flex items-center justify-center text-lg"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#002F6C] truncate">{r?.display_name ?? 'A fan'}</p>
                      <p className="text-xs text-[#002F6C]/70">wants to join your team</p>
                    </div>
                    <Button
                      size="icon"
                      onClick={() => respond.mutate({ id: req.id, accept: true })}
                      disabled={respond.isPending}
                      className="h-10 w-10 rounded-full bg-[#002F6C] text-white hover:bg-[#001f4d]"
                      aria-label="Accept"
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => respond.mutate({ id: req.id, accept: false })}
                      disabled={respond.isPending}
                      className="h-10 w-10 rounded-full"
                      aria-label="Decline"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Deck */}
        {isLoading ? (
          <div className="py-16 text-center text-white/80"> Loading your roster…</div>
        ) : (teammates?.length ?? 0) === 0 ? (
          <div className="rounded-2xl bg-white/95 p-8 text-center shadow-xl">
            <Users className="h-12 w-12 mx-auto text-[#002F6C] mb-3" />
            <h3 className="font-bold text-lg text-[#002F6C]">No Teammates yet</h3>
            <p className="text-sm text-[#002F6C]/75 mt-1 mb-4">
              Find fans you click with and tap <span className="font-semibold">Recruit to Team</span> on their profile.
            </p>
            <Button
              onClick={() => navigate('/discover')}
              className="rounded-xl bg-[#002F6C] text-white hover:bg-[#001f4d]"
            >
              Find Fans
            </Button>
          </div>
        ) : (
          <TeammateDeck
            teammates={teammates!}
            onCardClick={(uid) => navigate(`/profile/${uid}`)}
          />
        )}
      </div>
    </div>
  );
}
