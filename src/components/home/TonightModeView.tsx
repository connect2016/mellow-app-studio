import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Beer, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLineupMeetups } from '@/hooks/useLineup';
import { useCreateMeetup } from '@/contexts/CreateMeetupContext';
import { useSendLike } from '@/hooks/useInteractions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface Props {
  className?: string;
}

/**
 * Tonight Mode — minimal, high-contrast view focused on:
 *  1. Fans Nearby (Hi-Five + Invite)
 *  2. Meetups Happening Soon
 *  3. Bars With the Most Buddies
 *
 * Real-time refetch every ~15s.
 */
export function TonightModeView({ className }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { open: openCreate } = useCreateMeetup();
  const sendLike = useSendLike();

  // 1) Fans nearby (online in last 6h)
  const { data: fans = [] } = useQuery({
    queryKey: ['tonight-fans-nearby', user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.rpc('get_public_profiles', {
        p_only_onboarded: true,
        p_active_since: sixHoursAgo,
        p_limit: 30,
      });
      return (data ?? []).filter((p: any) => p.user_id !== user!.id);
    },
  });

  // 2) Meetups starting within the next 90 minutes
  const { data: meetups = [] } = useLineupMeetups();
  const happeningSoon = meetups
    .filter(m => {
      const mins = (new Date(m.meeting_time).getTime() - Date.now()) / 60000;
      return mins >= -15 && mins <= 90;
    })
    .slice(0, 5);

  // 3) Bars with the most buddies right now
  const { data: barRanking = [] } = useQuery({
    queryKey: ['tonight-bar-ranking'],
    enabled: !!user,
    refetchInterval: 20000,
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.rpc('get_public_profiles', {
        p_only_onboarded: true,
        p_active_since: sixHoursAgo,
        p_limit: 200,
      });
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p: any) => {
        if (p.wrigleyville_bar && p.game_status === 'AtBar') {
          counts[p.wrigleyville_bar] = (counts[p.wrigleyville_bar] || 0) + 1;
        }
      });
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
  });

  const handleHiFive = async (uid: string, name: string) => {
    try {
      await sendLike.mutateAsync({ toUser: uid, isHiFive: true });
      toast.success(`<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Hi-Fived ${name}!`);
    } catch {
      toast.error('Could not send Hi-Five');
    }
  };

  return (
    <div className={cn('space-y-6 tonight-activate', className)}>
      {/* SECTION 1 — Fans Nearby */}
      <section>
        <SectionHeader icon={<Users className="h-5 w-5" />} title="Fans Nearby" subtitle={`${fans.length} active right now`} />
        {fans.length === 0 ? (
          <EmptyCard text="No fans active nearby yet — check back in a few." />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {fans.slice(0, 6).map((f: any, idx: number) => (
              <div
                key={f.user_id}
                className="tonight-item rounded-2xl bg-card/95 backdrop-blur-sm border border-border/40 p-3 flex flex-col gap-2 shadow-sm"
                style={{ ['--i' as any]: idx }}
              >
                <button
                  onClick={() => navigate(`/profile/${f.user_id}`)}
                  className="flex items-center gap-2 min-w-0"
                >
                  <img
                    src={f.profile_photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'}
                    alt={f.display_name}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-yellow-300/60"
                  />
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold truncate text-foreground">{f.display_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {f.wrigleyville_bar || (f.game_status === 'AtWrigley' ? 'At Wrigley' : 'Online')}
                    </p>
                  </div>
                </button>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 text-xs font-bold"
                    onClick={() => handleHiFive(f.user_id, f.display_name)}
                  >
                    <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Hi-Five
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 text-xs font-bold bg-[#0E3386] hover:bg-[#0a2766] text-white"
                    onClick={() => openCreate()}
                  >
                    Invite
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2 — Meetups Happening Soon */}
      <section>
        <SectionHeader
          icon={<Sparkles className="h-5 w-5" />}
          title="Meetups Happening Soon"
          subtitle={`${happeningSoon.length} starting now or shortly`}
        />
        {happeningSoon.length === 0 ? (
          <EmptyCard text="No meetups in the next 90 minutes — start one!">
            <Button
              size="sm"
              className="bg-[#C8102E] hover:bg-[#a30d25] text-white font-bold"
              onClick={() => openCreate()}
            >
              + Start a Meetup
            </Button>
          </EmptyCard>
        ) : (
          <div className="space-y-2">
            {happeningSoon.map((m, idx) => {
              const mins = Math.round((new Date(m.meeting_time).getTime() - Date.now()) / 60000);
              const label = mins <= 0 ? 'LIVE' : `${mins}m`;
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(`/meetups/${m.id}`)}
                  className="tonight-item w-full flex items-center gap-3 rounded-2xl bg-card/95 backdrop-blur-sm border border-border/40 p-3 text-left shadow-sm hover:bg-card transition-colors"
                  style={{ ['--i' as any]: idx }}
                >
                  <div className="flex flex-col items-center justify-center min-w-[52px] h-12 rounded-xl bg-[#C8102E] text-white px-2">
                    <span className="text-[11px] font-bold leading-none">{mins <= 0 ? '●' : 'IN'}</span>
                    <span className="text-sm font-extrabold leading-none mt-0.5">{label}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-foreground">{m.location_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.creator_name} · {m.description || 'Join the meetup'}
                    </p>
                  </div>
                  <Button size="sm" className="h-9 px-3 text-xs font-bold bg-[#0E3386] hover:bg-[#0a2766] text-white">
                    Join Now
                  </Button>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3 — Bars With the Most Buddies */}
      <section>
        <SectionHeader
          icon={<Beer className="h-5 w-5" />}
          title="Bars With the Most Buddies"
          subtitle="Live counts · updated every 20s"
        />
        {barRanking.length === 0 ? (
          <EmptyCard text="No bars are buzzing yet — be the first to check in." />
        ) : (
          <div className="space-y-2">
            {barRanking.map((b, i) => (
              <div
                key={b.name}
                className="tonight-item flex items-center gap-3 rounded-2xl bg-card/95 backdrop-blur-sm border border-border/40 p-3 shadow-sm"
                style={{ ['--i' as any]: i }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-300 text-[#0E3386] font-extrabold text-base">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {b.count} {b.count === 1 ? 'buddy' : 'buddies'} here
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-9 px-3 text-xs font-bold bg-[#C8102E] hover:bg-[#a30d25] text-white"
                  onClick={() => openCreate(b.name)}
                >
                  Start Meetup
                </Button>
              </div>
            ))}
            <button
              onClick={() => navigate('/bar-map')}
              className="w-full mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white/90 hover:text-white py-2"
            >
              <MapPin className="h-3.5 w-3.5" /> See all bars on the map
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-2 px-1 flex items-end justify-between">
      <div className="flex items-center gap-2 text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-300 text-[#0E3386]">
          {icon}
        </span>
        <h2
          className="text-[15px] font-extrabold uppercase tracking-wide"
          style={{ fontFamily: 'Norwester, sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
        >
          {title}
        </h2>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">{subtitle}</p>
    </div>
  );
}

function EmptyCard({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-dashed border-border/50 p-5 text-center">
      <p className="text-sm text-muted-foreground mb-2">{text}</p>
      {children}
    </div>
  );
}
