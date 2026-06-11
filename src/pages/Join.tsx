import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { storeInviteRef, consumeInviteRefIfPresent } from '@/lib/invite-ref';
import { Button } from '@/components/ui/button';
import { UserBaseballCard } from '@/components/UserBaseballCard';
import { SEOMeta } from '@/components/SEOMeta';
import { track } from '@/lib/analytics';
import type { GameStatus, IntentType, GamedayIntentType } from '@/types';

type InviterProfile = {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
  game_status: string | null;
  wrigley_section: string | null;
  wrigleyville_bar: string | null;
  intent: string[] | null;
  gameday_intents: string[] | null;
};

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default function Join() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const ref = params.get('ref') ?? '';
  const validRef = useMemo(() => (isUuid(ref) ? ref : null), [ref]);

  const [inviter, setInviter] = useState<InviterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Persist ref + analytics
  useEffect(() => {
    if (!validRef) return;
    storeInviteRef(validRef);
    track('invite_landing_viewed', { ref: validRef });
  }, [validRef]);

  // Fetch inviter via the existing public RPC
  useEffect(() => {
    let active = true;
    if (!validRef) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase.rpc('get_public_profiles', {
          p_user_ids: [validRef],
          p_only_onboarded: false,
          p_limit: 1,
        });
        if (!active) return;
        const row = (data as InviterProfile[] | null)?.[0] ?? null;
        setInviter(row);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [validRef]);

  // If they are already logged in, consume immediately and bounce to /discover-fans
  useEffect(() => {
    if (authLoading || !user || !validRef) return;
    (async () => {
      const result = await consumeInviteRefIfPresent(user.id);
      track('invite_auto_consumed', { ref: validRef, consumed: result.consumed });
      navigate('/discover-fans', { replace: true });
    })();
  }, [authLoading, user, validRef, navigate]);

  const inviterName = inviter?.display_name?.trim() || 'A fan';

  return (
    <>
      <SEOMeta
        title={`${inviterName} invited you to Wrigleyville Buddies`}
        description="Find your Cubs crew at Wrigleyville. Join Wrigleyville Buddies — free."
        url="https://wrigleyvillebuddies.com/join"
      />

      <main className="min-h-screen bg-background pb-24">
        <header className="border-b border-border/40 bg-card/60 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
            <Link to="/" className="text-sm font-bold text-[hsl(var(--brand-navy))]">Wrigleyville Buddies</Link>
            <Link
              to="/auth"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-lg px-4 pt-6">
          <div className="text-center space-y-1.5 mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--brand-red))]">
              You're invited
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground">
              {inviterName} wants you on their Cubs crew
            </h1>
            <p className="text-sm text-muted-foreground">
              Find fellow fans, plan game-day meetups, and meet your section squad.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !validRef ? (
            <div className="rounded-2xl border border-border bg-card/80 p-5 text-center">
              <p className="text-sm text-muted-foreground">
                This invite link looks broken — but you can still join the crew.
              </p>
            </div>
          ) : !inviter ? (
            <div className="rounded-2xl border border-border bg-card/80 p-5 text-center">
              <p className="text-sm text-muted-foreground">
                We couldn't load this fan's card, but their invite is saved.
              </p>
            </div>
          ) : (
            <div className="pointer-events-none">
              <UserBaseballCard
                profileImage={inviter.profile_photo}
                displayName={inviter.display_name || 'A fan'}
                gameStatus={inviter.game_status as GameStatus}
                wrigleySection={inviter.wrigley_section}
                wrigleyvilleBar={inviter.wrigleyville_bar}
                intents={(inviter.intent as IntentType[]) ?? []}
                gamedayIntents={(inviter.gameday_intents as GamedayIntentType[]) ?? []}
                isOwner={false}
                className="max-w-full"
              />
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button
              className="w-full h-14 rounded-xl text-base font-bold gap-2 bg-[hsl(var(--brand-red))] hover:bg-[hsl(var(--brand-red))] text-white"
              onClick={() => {
                track('invite_join_clicked', { ref: validRef });
                navigate('/auth?mode=signup');
              }}
            >
              Join Wrigleyville Buddies — Free <ArrowRight className="h-5 w-5" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link to="/auth" className="font-semibold text-[hsl(var(--brand-navy))] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
