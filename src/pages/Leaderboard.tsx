import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/AppHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Users, Beer, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabKey = 'fans' | 'crews' | 'bars';

const TABS: { key: TabKey; label: string; icon: typeof Trophy }[] = [
  { key: 'fans', label: 'Top Fans', icon: Trophy },
  { key: 'crews', label: 'Most Active Crews', icon: Users },
  { key: 'bars', label: 'Bar Champions', icon: Beer },
];

const MEDALS = ['🥇', '🥈', '🥉'];

function MedalOrRank({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span className="text-2xl leading-none w-9 text-center" aria-label={`Rank ${rank}`}>
        {MEDALS[rank - 1]}
      </span>
    );
  }
  return (
    <span className="w-9 text-center text-base font-bold text-muted-foreground tabular-nums">
      {rank}
    </span>
  );
}

function RowShell({
  rank,
  highlight,
  onClick,
  children,
}: {
  rank: number;
  highlight?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const isTop3 = rank <= 3;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all min-h-[64px]',
        'border',
        highlight
          ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/30'
          : isTop3
          ? 'bg-card border-primary/30 shadow-sm'
          : 'bg-card border-border',
        onClick && 'active:scale-[0.99] hover:border-primary/50'
      )}
    >
      <MedalOrRank rank={rank} />
      {children}
    </button>
  );
}

// ---------- FANS ----------

interface FanRow {
  rank: number;
  user_id: string;
  display_name: string;
  profile_photo: string | null;
  missions_completed: number;
  points_total: number;
}

function FansTab() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const topQ = useQuery({
    queryKey: ['lb-top-fans'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('leaderboard_top_fans', { _limit: 10 });
      if (error) throw error;
      return (data ?? []) as unknown as FanRow[];
    },
  });

  const meQ = useQuery({
    queryKey: ['lb-my-fan-rank', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('leaderboard_my_fan_rank');
      if (error) throw error;
      return ((data ?? []) as unknown as FanRow[])[0] ?? null;
    },
    enabled: !!user,
  });

  if (topQ.isLoading) return <LoadingState />;
  const top = topQ.data ?? [];
  const inTop = !!top.find((r) => r.user_id === user?.id);

  return (
    <div className="space-y-2">
      {top.length === 0 && <EmptyState message="No mission rankings yet. Be the first!" />}
      {top.map((r) => (
        <RowShell
          key={r.user_id}
          rank={Number(r.rank)}
          highlight={r.user_id === user?.id}
          onClick={() => navigate(`/u/${r.user_id}`)}
        >
          <Avatar src={r.profile_photo} name={r.display_name} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate">{r.display_name}</div>
            <div className="text-xs text-muted-foreground">
              {r.missions_completed} missions completed
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary tabular-nums">{r.points_total}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">pts</div>
          </div>
        </RowShell>
      ))}

      {!inTop && meQ.data && (
        <>
          <YouDivider />
          <RowShell rank={Number(meQ.data.rank)} highlight onClick={() => navigate(`/u/${meQ.data!.user_id}`)}>
            <Avatar src={meQ.data.profile_photo} name={meQ.data.display_name} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground truncate">You</div>
              <div className="text-xs text-muted-foreground">
                {meQ.data.missions_completed} missions completed
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary tabular-nums">
                {meQ.data.points_total}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">pts</div>
            </div>
          </RowShell>
        </>
      )}
    </div>
  );
}

// ---------- CREWS ----------

interface CrewRow {
  rank: number;
  crew_id: string;
  crew_name: string;
  badge_emoji: string;
  member_count: number;
  checkin_total: number;
}

function CrewsTab() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const topQ = useQuery({
    queryKey: ['lb-top-crews'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('leaderboard_top_crews', { _limit: 10 });
      if (error) throw error;
      return (data ?? []) as unknown as CrewRow[];
    },
  });

  const meQ = useQuery({
    queryKey: ['lb-my-crew-rank', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('leaderboard_my_crew_rank');
      if (error) throw error;
      return ((data ?? []) as unknown as CrewRow[])[0] ?? null;
    },
    enabled: !!user,
  });

  if (topQ.isLoading) return <LoadingState />;
  const top = topQ.data ?? [];
  const inTop = meQ.data ? !!top.find((r) => r.crew_id === meQ.data!.crew_id) : true;

  return (
    <div className="space-y-2">
      {top.length === 0 && <EmptyState message="No crews on the board yet — start one!" />}
      {top.map((r) => (
        <CrewRowItem key={r.crew_id} row={r} highlight={meQ.data?.crew_id === r.crew_id} onClick={() => navigate(`/crews/${r.crew_id}`)} />
      ))}

      {!inTop && meQ.data && (
        <>
          <YouDivider />
          <CrewRowItem row={meQ.data} highlight onClick={() => navigate(`/crews/${meQ.data!.crew_id}`)} />
        </>
      )}
    </div>
  );
}

function CrewRowItem({ row, highlight, onClick }: { row: CrewRow; highlight?: boolean; onClick?: () => void }) {
  return (
    <RowShell rank={Number(row.rank)} highlight={highlight} onClick={onClick}>
      <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xl shrink-0">
        {row.badge_emoji || '⚾'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground truncate">{row.crew_name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            <Users className="h-3 w-3" />
            {row.member_count} {row.member_count === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-accent tabular-nums">{row.checkin_total}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">check-ins</div>
      </div>
    </RowShell>
  );
}

// ---------- BARS ----------

interface BarRow {
  rank: number;
  bar_name: string;
  checkin_count: number;
}

function BarsTab() {
  const navigate = useNavigate();

  const topQ = useQuery({
    queryKey: ['lb-top-bars'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('leaderboard_top_bars', { _limit: 10 });
      if (error) throw error;
      return (data ?? []) as unknown as BarRow[];
    },
  });

  if (topQ.isLoading) return <LoadingState />;
  const top = topQ.data ?? [];

  return (
    <div className="space-y-2">
      {top.length === 0 && <EmptyState message="No bar check-ins this week yet." />}
      {top.map((r) => (
        <RowShell key={r.bar_name} rank={Number(r.rank)} onClick={() => navigate('/bar-map')}>
          <div className="h-10 w-10 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center text-xl shrink-0">
            🍻
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate">{r.bar_name}</div>
            <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              Wrigleyville
            </span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-accent tabular-nums">{r.checkin_count}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">this week</div>
          </div>
        </RowShell>
      ))}
    </div>
  );
}

// ---------- SHARED BITS ----------

function Avatar({ src, name }: { src: string | null | undefined; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-10 w-10 rounded-full object-cover border-2 border-primary shrink-0" loading="lazy" decoding="async" />
    );
  }
  return (
    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold border-2 border-primary shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function YouDivider() {
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Your rank
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

// ---------- PAGE ----------

export default function Leaderboard() {
  const [tab, setTab] = useState<TabKey>('fans');

  return (
    <div
      className="relative min-h-screen pb-24"
      style={{
        backgroundImage: 'url(/leaderboard-oldstyle-bg-v1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'rgba(255,255,255,0.82)' }}
      />
      <AppHeader />

      <div className="relative mx-auto max-w-lg px-4 pt-2">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
        </div>

        {/* Tabs */}
        <div className="sticky top-[var(--app-header-h,64px)] z-10 -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'flex-1 min-h-[44px] px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <t.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4">
          {tab === 'fans' && <FansTab />}
          {tab === 'crews' && <CrewsTab />}
          {tab === 'bars' && <BarsTab />}
        </div>
      </div>
    </div>
  );
}
