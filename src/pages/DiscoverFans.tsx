import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Beer } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { WrigleyRainbowBackground } from '@/components/WrigleyRainbowBackground';
import { SEOMeta } from '@/components/SEOMeta';
import { Button } from '@/components/ui/button';
import { ProfileCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { InviteFriendsButton } from '@/components/invite/InviteFriendsButton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useDiscoverFans, sayHiToBuddy, type DiscoverFilter, type DiscoverFan } from '@/hooks/useDiscoverFans';
import { BuyBeerModal } from '@/components/beer/BuyBeerModal';
import { DesktopPanel } from '@/components/DesktopPanel';
import { STHBadge } from '@/components/profile/STHBadge';

const CHIPS: { id: DiscoverFilter; label: string }[] = [
  { id: 'all', label: 'All Fans' },
  { id: 'sth', label: '⭐ Season Ticket Holders' },
  { id: 'near_me', label: 'Near Me' },
  { id: 'bleachers', label: 'Bleachers' },
  { id: 'my_gate', label: 'My Gate' },
  { id: 'same_vibe', label: 'Same Vibe' },
  { id: 'new_week', label: 'New This Week' },
];

export default function DiscoverFans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: me } = useProfile();
  const [filter, setFilter] = useState<DiscoverFilter>('all');
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [beerCtx, setBeerCtx] = useState<{ userId: string; firstName?: string; avatarUrl?: string } | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (filter !== 'near_me' || geo || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast.error("Couldn't grab your location — try another filter."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, [filter, geo]);

  const myVibeTags = (me as any)?.vibe_tags as string[] | undefined;
  const myGate = (me as any)?.favorite_gate as string | undefined;

  const { data: fans, isLoading } = useDiscoverFans({
    filter,
    currentUserGate: myGate,
    currentUserVibeTags: myVibeTags,
    geo,
  });

  const activeCount = fans?.length ?? 0;

  const handleSayHi = async (fanId: string, fanName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setPending((p) => ({ ...p, [fanId]: true }));
    try {
      const res = await sayHiToBuddy(fanId);
      if (res.result === 'sent') {
        toast.success(`👋 You said hi to ${fanName}!`);
      } else if (res.result === 'accepted') {
        toast.success(`You're connected with ${fanName} — chat opened.`);
        if (res.conversation_id) navigate(`/messages?c=${res.conversation_id}`);
      } else if (res.result === 'already_connected') {
        if (res.conversation_id) navigate(`/messages?c=${res.conversation_id}`);
      } else if (res.result === 'already_sent') {
        toast(`Already said hi to ${fanName}.`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't send — try again in a sec.");
    } finally {
      setPending((p) => ({ ...p, [fanId]: false }));
    }
  };

  return (
    <WrigleyRainbowBackground>
      <SEOMeta title="Discover Fans · Wrigleyville Buddies" description="Find Cubs fans near Wrigleyville to meet up, chat, and share the bleachers." />
      <AppHeader />

      <div className="mx-auto max-w-2xl px-4 pb-24 pt-3">
        {/* Active count headline */}
        <div className="mb-3">
          <p className="text-2xl font-bold leading-tight">
            {activeCount >= 1
              ? `${activeCount} ${activeCount === 1 ? 'fan' : 'fans'} active near Wrigleyville`
              : 'Find fans near Wrigleyville'}
          </p>
          <p className="text-sm text-muted-foreground">Pick a filter to narrow your view.</p>
        </div>

        {/* Filter chips */}
        <div className="relative -mx-4 mb-4">
          <div
            className="overflow-x-auto px-4 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex flex-nowrap gap-2">
              {CHIPS.map((chip) => {
                const active = chip.id === filter;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setFilter(chip.id)}
                    className={cn(
                      'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[40px]',
                      active
                        ? 'bg-[hsl(var(--brand-navy))] text-white'
                        : 'border border-neutral-300 bg-transparent text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800',
                    )}
                    aria-pressed={active}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Right-edge fade affordance */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent"
          />
        </div>


        {/* Fan list */}
        {isLoading ? (
          <div className="space-y-3">
            <ProfileCardSkeleton />
            <ProfileCardSkeleton />
            <ProfileCardSkeleton />
          </div>
        ) : !fans || fans.length === 0 ? (
          <div className="flex flex-col items-center">
            <EmptyState
              title="No fans found nearby"
              description="Try 'All Fans' or invite a friend to join you at Wrigley."
              actionLabel={filter !== 'all' ? 'Show all fans' : undefined}
              onAction={filter !== 'all' ? () => setFilter('all') : undefined}
              hideInviteCta
            />
            <div className="w-full max-w-xs px-4 -mt-4 pb-4">
              <InviteFriendsButton source="discover-empty" />
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {fans.map((fan) => (
              <FanRow
                key={fan.user_id}
                fan={fan}
                myVibeTags={myVibeTags ?? []}
                pending={!!pending[fan.user_id]}
                onSayHi={() => handleSayHi(fan.user_id, fan.display_name ?? 'this fan')}
                onBeer={() => setBeerCtx({ userId: fan.user_id, firstName: fan.display_name ?? undefined, avatarUrl: fan.profile_photo ?? undefined })}
              />
            ))}
          </ul>
        )}
      </div>

      {beerCtx && (
        <BuyBeerModal
          open={!!beerCtx}
          onOpenChange={(o) => !o && setBeerCtx(null)}
          context={{ kind: 'fan', userId: beerCtx.userId, firstName: beerCtx.firstName, avatarUrl: beerCtx.avatarUrl }}
        />
      )}
    </WrigleyRainbowBackground>
  );
}

interface FanRowProps {
  fan: DiscoverFan;
  myVibeTags: string[];
  pending: boolean;
  onSayHi: () => void;
  onBeer: () => void;
}

function FanRow({ fan, myVibeTags, pending, onSayHi, onBeer }: FanRowProps) {
  const sharedTags = useMemo(() => {
    const mine = new Set(myVibeTags);
    return (fan.vibe_tags ?? []).filter((t) => mine.has(t)).slice(0, 2);
  }, [fan.vibe_tags, myVibeTags]);

  const initials = (fan.display_name ?? '?').slice(0, 1).toUpperCase();

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card p-3">
      {/* Avatar */}
      <div className="relative h-12 w-12 shrink-0">
        <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
          {fan.profile_photo ? (
            <img src={fan.profile_photo} alt={fan.display_name ?? 'Fan'} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">{initials}</div>
          )}
        </div>
        {fan.is_season_ticket_holder && (
          <STHBadge size="xs" className="absolute -bottom-0.5 -right-0.5 ring-2 ring-card" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{fan.display_name ?? 'Fan'}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {fan.zip_code && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{fan.zip_code}</span>
          )}
          {fan.favorite_gate && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{fan.favorite_gate}</span>
          )}
          {sharedTags.map((t) => (
            <span key={t} className="rounded-full bg-[hsl(var(--brand-navy))] px-2 py-0.5 text-[11px] font-medium text-white">{t}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          onClick={onSayHi}
          disabled={pending}
          className="min-h-[44px] min-w-[44px] rounded-full bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy))]/90"
        >
          {pending ? '…' : 'Say Hi'}
        </Button>
        <button
          type="button"
          onClick={onBeer}
          aria-label={`Buy ${fan.display_name ?? 'this fan'} a beer`}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border/60 text-amber-600 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/30"
        >
          <Beer className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
