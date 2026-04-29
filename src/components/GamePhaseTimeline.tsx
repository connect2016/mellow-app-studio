import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamePhase, type GamePhase } from '@/hooks/useGamePhase';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  Clock, MapPin, Users, Beer, Zap, Trophy, Radio,
  PartyPopper, MessageCircle, ArrowRight, Flame
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

// ────────────────────── Types ──────────────────────

interface TimelineEvent {
  id: string;
  type: 'phase-marker' | 'social-cta' | 'activity' | 'milestone';
  phase: GamePhase;
  priority: number; // lower = higher on timeline
  emoji: string;
  headline: string;
  subtext?: string;
  action?: { label: string; route: string };
  timestamp?: string;
  accent?: 'primary' | 'secondary' | 'accent' | 'teal';
}

// ────────────────── Phase Config ──────────────────

const PHASE_CONFIG: Record<GamePhase, { label: string; emoji: string; color: string; bgClass: string }> = {
  'no-game': { label: 'Off Day', emoji: '', color: 'hsl(var(--muted-foreground))', bgClass: 'bg-muted/50' },
  'pre-game': { label: 'Pre-Game', emoji: '', color: 'hsl(var(--accent))', bgClass: 'bg-accent/5' },
  'mid-game': { label: 'Game On', emoji: '', color: 'hsl(var(--secondary))', bgClass: 'bg-secondary/5' },
  'post-game': { label: 'Post-Game', emoji: '', color: 'hsl(var(--lineup-teal))', bgClass: 'bg-primary/5' },
};

// ────────────────── Component ──────────────────

export function GamePhaseTimeline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: phaseData, isLoading: phaseLoading } = useGamePhase();

  const phase = phaseData?.phase ?? 'no-game';
  const config = PHASE_CONFIG[phase];

  // Fetch live social signals
  const { data: signals } = useQuery({
    queryKey: ['timeline-signals', phase],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const [
        { count: wrigleyCount },
        { count: barCount },
        { data: activeMeetups },
        { data: recentCheckins },
        { data: activeSessions },
        { data: topBars },
      ] = await Promise.all([
        supabase.rpc('get_public_profiles', { p_game_status: 'AtWrigley', p_active_since: sixHoursAgo, p_limit: 500 }).then(r => ({ count: r.data?.length ?? 0 })),
        supabase.rpc('get_public_profiles', { p_game_status: 'AtBar', p_active_since: sixHoursAgo, p_limit: 500 }).then(r => ({ count: r.data?.length ?? 0 })),
        supabase.from('lineup_meetups').select('id, location_name, meeting_time').eq('status', 'active').gte('expires_at', new Date().toISOString()).limit(5),
        supabase.rpc('get_public_profiles', { p_active_since: thirtyMinAgo, p_limit: 8 }).then(r => ({ data: (r.data ?? []).filter((p: any) => p.game_status !== 'NotSet') })),
        supabase.from('scoring_sessions').select('id, title').eq('status', 'live').limit(3),
        supabase.rpc('get_public_profiles', { p_game_status: 'AtBar', p_active_since: sixHoursAgo, p_require_bar: true, p_limit: 500 }),
      ]);

      // Aggregate bar counts
      const barCounts: Record<string, number> = {};
      topBars?.forEach(p => {
        const b = p.wrigleyville_bar as string;
        barCounts[b] = (barCounts[b] || 0) + 1;
      });
      const sortedBars = Object.entries(barCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

      return {
        wrigleyCount: wrigleyCount ?? 0,
        barCount: barCount ?? 0,
        meetups: activeMeetups ?? [],
        recentCheckins: (recentCheckins ?? []).filter(c => c.user_id !== user?.id),
        sessions: activeSessions ?? [],
        topBars: sortedBars,
      };
    },
    refetchInterval: 20000,
    enabled: !!user,
  });

  // Build timeline events based on current phase
  const events = useMemo(() => {
    if (!signals) return [];
    const items: TimelineEvent[] = [];
    const totalFans = signals.wrigleyCount + signals.barCount;

    // ── Phase marker (always first)
    if (phaseData?.game) {
      const g = phaseData.game;
      let phaseSubtext = '';
      if (phase === 'pre-game' && phaseData.minutesToStart != null) {
        const hrs = Math.floor(phaseData.minutesToStart / 60);
        const mins = phaseData.minutesToStart % 60;
        phaseSubtext = hrs > 0 ? `First pitch in ${hrs}h ${mins}m` : `First pitch in ${mins}m`;
      } else if (phase === 'mid-game') {
        phaseSubtext = phaseData.inningEstimate ? `~Inning ${phaseData.inningEstimate}` : 'Game in progress';
      } else if (phase === 'post-game' && phaseData.minutesSinceEnd != null) {
        phaseSubtext = phaseData.minutesSinceEnd < 60
          ? `Game ended ${phaseData.minutesSinceEnd}m ago`
          : `Game ended ${Math.floor(phaseData.minutesSinceEnd / 60)}h ago`;
      }

      items.push({
        id: 'phase-marker',
        type: 'phase-marker',
        phase,
        priority: 0,
        emoji: config.emoji,
        headline: `Cubs vs ${g.opponent}`,
        subtext: phaseSubtext,
        accent: phase === 'mid-game' ? 'secondary' : phase === 'post-game' ? 'teal' : 'accent',
      });
    }

    // ── PRE-GAME social CTAs
    if (phase === 'pre-game' || phase === 'no-game') {
      if (signals.topBars.length > 0) {
        const [topBar, topCount] = signals.topBars[0];
        items.push({
          id: 'pregame-bar-hot',
          type: 'social-cta',
          phase,
          priority: 10,
          emoji: '',
          headline: `${topBar} is heating up`,
          subtext: `${topCount} fan${topCount !== 1 ? 's' : ''} already there — grab a pre-game drink`,
          action: { label: 'Check In', route: '/checkin' },
          accent: 'secondary',
        });
      }

      if (signals.meetups.length > 0) {
        items.push({
          id: 'pregame-meetups',
          type: 'social-cta',
          phase,
          priority: 15,
          emoji: '',
          headline: `${signals.meetups.length} pre-game meetup${signals.meetups.length !== 1 ? 's' : ''} open`,
          subtext: signals.meetups[0]?.location_name ? `Including one at ${signals.meetups[0].location_name}` : 'Find fans to meet up with',
          action: { label: 'Browse Lineup', route: '/discover' },
          accent: 'teal',
        });
      }

      items.push({
        id: 'pregame-checkin-cta',
        type: 'social-cta',
        phase,
        priority: 20,
        emoji: '',
        headline: 'Set your status',
        subtext: 'Let fans know where you are so they can find you',
        action: { label: 'Check In', route: '/checkin' },
        accent: 'primary',
      });
    }

    // ── MID-GAME social CTAs
    if (phase === 'mid-game') {
      if (signals.wrigleyCount > 0) {
        items.push({
          id: 'midgame-section-chat',
          type: 'social-cta',
          phase,
          priority: 10,
          emoji: '',
          headline: `${signals.wrigleyCount} fans live at Wrigley`,
          subtext: 'Jump into your Section Chat',
          action: { label: 'Open Chat', route: '/section-chat' },
          accent: 'accent',
        });
      }

      if (signals.sessions.length > 0) {
        items.push({
          id: 'midgame-scoring',
          type: 'social-cta',
          phase,
          priority: 12,
          emoji: '',
          headline: `${signals.sessions.length} live scoring session${signals.sessions.length !== 1 ? 's' : ''}`,
          subtext: signals.sessions[0]?.title ?? 'Score along with the crowd',
          action: { label: 'Join Session', route: '/score-lobby' },
          accent: 'secondary',
        });
      }

      // Mid-game bar crawl
      if (signals.barCount >= 3) {
        items.push({
          id: 'midgame-bars',
          type: 'social-cta',
          phase,
          priority: 18,
          emoji: '',
          headline: `${signals.barCount} fans watching at bars`,
          subtext: signals.topBars.length > 0 ? `${signals.topBars[0][0]} is the hottest spot` : 'Join the Wrigleyville crowd',
          action: { label: 'See Map', route: '/bar-map' },
          accent: 'teal',
        });
      }
    }

    // ── POST-GAME social CTAs
    if (phase === 'post-game') {
      if (signals.topBars.length > 0) {
        items.push({
          id: 'postgame-where',
          type: 'social-cta',
          phase,
          priority: 10,
          emoji: '',
          headline: 'Where is everyone going?',
          subtext: signals.topBars.map(([bar, count]) => `${bar} (${count})`).join(' · '),
          action: { label: 'See Bars', route: '/bar-map' },
          accent: 'teal',
        });
      }

      if (totalFans >= 5) {
        items.push({
          id: 'postgame-vibe',
          type: 'social-cta',
          phase,
          priority: 15,
          emoji: '',
          headline: 'Post your game moment',
          subtext: `${totalFans} fans still active — share while the vibe is hot`,
          action: { label: 'Vibe Feed', route: '/vibe-feed' },
          accent: 'secondary',
        });
      }

      items.push({
        id: 'postgame-memories',
        type: 'social-cta',
        phase,
        priority: 20,
        emoji: '',
        headline: 'Save today to Memories',
        subtext: 'Tag friends and add a caption before the moment fades',
        action: { label: 'Add Memory', route: '/memories' },
        accent: 'primary',
      });
    }

    // ── ACTIVITY items (all phases)
    signals.recentCheckins.slice(0, 4).forEach((c, i) => {
      const statusMeta: Record<string, string> = {
        AtWrigley: 'checked in at Wrigley ',
        AtBar: c.wrigleyville_bar ? `is at ${c.wrigleyville_bar} ` : 'is at a bar ',
        WatchingRemote: 'is watching from home ',
        Tailgating: 'is tailgating ',
      };
      items.push({
        id: `activity-${c.user_id}`,
        type: 'activity',
        phase,
        priority: 50 + i,
        emoji: c.game_status === 'AtWrigley' ? '' : c.game_status === 'AtBar' ? '' : '',
        headline: `${c.display_name} ${statusMeta[c.game_status as string] ?? 'is active'}`,
        timestamp: c.location_last_set_at ?? undefined,
      });
    });

    // ── MILESTONE
    if (totalFans >= 10) {
      items.push({
        id: 'milestone-fans',
        type: 'milestone',
        phase,
        priority: 5,
        emoji: '',
        headline: `${totalFans} fans are live right now!`,
        subtext: 'The community is buzzing',
        accent: 'secondary',
      });
    }

    return items.sort((a, b) => a.priority - b.priority);
  }, [phase, phaseData, signals, config]);

  if (phaseLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} className="inline-block">
          <Radio className="h-5 w-5 text-primary" />
        </motion.div>
        <p className="mt-2 text-xs text-muted-foreground">Syncing game phase...</p>
      </div>
    );
  }

  const ACCENT_CLASSES: Record<string, string> = {
    primary: 'border-primary/20 bg-primary/5',
    secondary: 'border-secondary/20 bg-secondary/5',
    accent: 'border-accent/20 bg-accent/5',
    teal: 'border-border bg-card',
  };

  const ACCENT_DOT: Record<string, string> = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    teal: 'bg-[hsl(var(--lineup-teal))]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
    >
      {/* Phase header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-border ${config.bgClass}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg"><ConceptIcon name={config.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {config.label}
              {phaseData?.game && (
                <span className="font-normal text-muted-foreground ml-1.5">
                  — Cubs vs {phaseData.game.opponent}
                </span>
              )}
            </h3>
            {events[0]?.type === 'phase-marker' && events[0].subtext && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{events[0].subtext}</p>
            )}
          </div>
        </div>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: config.color }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: config.color }} />
        </span>
      </div>

      {/* Timeline */}
      <div className="relative px-4 py-3">
        {/* Vertical line */}
        <div className="absolute left-[26px] top-3 bottom-3 w-px bg-border" />

        <div className="space-y-0.5">
          <AnimatePresence mode="popLayout">
            {events.filter(e => e.type !== 'phase-marker').map((event, i) => {
              const accentKey = event.accent ?? 'primary';
              const dotColor = ACCENT_DOT[accentKey] ?? 'bg-primary';

              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pl-8 py-2"
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-[22px] top-4 h-2.5 w-2.5 rounded-full border-2 border-background ${dotColor} z-10`} />

                  {event.type === 'social-cta' ? (
                    <button
                      onClick={() => event.action && navigate(event.action.route)}
                      className={`w-full text-left rounded-xl border p-3 transition-all hover:shadow-sm ${ACCENT_CLASSES[accentKey] ?? ''}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-base mt-0.5 shrink-0"><ConceptIcon name={event.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug">{event.headline}</p>
                          {event.subtext && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{event.subtext}</p>
                          )}
                        </div>
                        {event.action && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary whitespace-nowrap shrink-0 mt-1">
                            {event.action.label}
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </button>
                  ) : event.type === 'milestone' ? (
                    <div className="rounded-xl border-2 border-dashed border-secondary/30 bg-secondary/[0.03] p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base"><ConceptIcon name={event.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
                        <div>
                          <p className="text-sm font-bold text-foreground">{event.headline}</p>
                          {event.subtext && <p className="text-[10px] text-muted-foreground">{event.subtext}</p>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm shrink-0"><ConceptIcon name={event.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
                      <p className="text-xs text-foreground flex-1 min-w-0 truncate">{event.headline}</p>
                      {event.timestamp && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {formatDistanceToNowStrict(new Date(event.timestamp), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {events.filter(e => e.type !== 'phase-marker').length === 0 && (
            <div className="pl-8 py-6 text-center">
              <p className="text-sm text-muted-foreground">No activity yet — be the first to check in!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
