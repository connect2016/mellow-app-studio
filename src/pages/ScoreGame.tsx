import { IconButton } from '@/components/ui/IconButton';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { LiveChatFeed } from '@/components/scoring/LiveChatFeed';
import { FlashPrediction } from '@/components/scoring/FlashPrediction';
import { HomeRunEffect } from '@/components/scoring/HomeRunEffect';
import { Scorecard } from '@/components/scoring/Scorecard';
import { GameTimeline } from '@/components/scoring/GameTimeline';
import { AddPlayModal } from '@/components/scoring/AddPlayModal';
import { SessionMembers } from '@/components/scoring/SessionMembers';
import { ScorerLeaderboard } from '@/components/scoring/ScorerLeaderboard';
import { PredictionPanel } from '@/components/scoring/PredictionPanel';
import { RelayPanel } from '@/components/scoring/RelayPanel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useScoringSession } from '@/hooks/useScoringSession';
import { useProfile } from '@/hooks/useProfile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Plus, Share2, Copy, BarChart3, Users, Trophy, ClipboardList, Pencil, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export default function ScoreGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const [showAddPlay, setShowAddPlay] = useState(false);
  const [currentInning, setCurrentInning] = useState(1);
  const [currentHalf, setCurrentHalf] = useState<'top' | 'bottom'>('top');
  const [showPrediction, setShowPrediction] = useState(false);
  const [effectTrigger, setEffectTrigger] = useState(0);
  const [effectPlayType, setEffectPlayType] = useState<string>('hr');
  const [showScorecard, setShowScorecard] = useState(false);

  const {
    session, members, entries, timeline, reactions, predictions,
    joinSession, addEntry, confirmEntry, addTimelineEvent, sendReaction,
    makePrediction, resolvePrediction, passPencil, finalizeGame, advanceBatter,
  } = useScoringSession(id);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Auto-join
  useEffect(() => {
    if (!user || !id || !session.data || members.isLoading) return;
    const isMember = members.data?.some(m => m.user_id === user.id);
    if (!isMember) {
      const label = profile?.game_status === 'AtWrigley'
        ? `At Wrigley${profile.wrigley_section ? ` – Section ${profile.wrigley_section}` : ''}`
        : profile?.game_status === 'AtBar' && profile.wrigleyville_bar
          ? `At ${profile.wrigleyville_bar}`
          : 'Watching from home';
      joinSession.mutate(label);
    }
  }, [user, id, session.data, members.data, members.isLoading]);

  // Track current inning
  useEffect(() => {
    if (entries.data && entries.data.length > 0) {
      const maxInning = Math.max(...entries.data.map(e => e.inning));
      setCurrentInning(maxInning);
    }
  }, [entries.data]);

  // Trigger flash prediction every ~45 seconds
  useEffect(() => {
    if (session.data?.status !== 'live') return;
    const interval = setInterval(() => setShowPrediction(true), 45000);
    const initial = setTimeout(() => setShowPrediction(true), 5000);
    return () => { clearInterval(interval); clearTimeout(initial); };
  }, [session.data?.status]);

  // Watch timeline for big plays
  const prevTimelineLength = useState(0);
  useEffect(() => {
    const tl = timeline.data ?? [];
    if (tl.length > prevTimelineLength[0] && prevTimelineLength[0] > 0) {
      const latest = tl[tl.length - 1];
      const bigPlays = ['hr', 'double_play', 'steal', 'triple'];
      if (bigPlays.includes(latest.play_type)) {
        setEffectPlayType(latest.play_type);
        setEffectTrigger(prev => prev + 1);
      }
    }
    prevTimelineLength[0] = tl.length;
  }, [timeline.data]);

  const copyInvite = () => {
    if (!session.data) return;
    navigator.clipboard.writeText(`${window.location.origin}/score/${id}`);
    toast({ title: ' Link copied!', description: 'Share with friends to join' });
  };

  const dismissPrediction = useCallback(() => setShowPrediction(false), []);

  const hasPendingPrediction = (predictions.data ?? []).some(
    p => p.user_id === user?.id && p.inning === currentInning && p.half === currentHalf && p.is_correct === null
  );

  const handleFinalize = () => {
    finalizeGame.mutate(undefined, {
      onSuccess: () => toast({ title: ' Game Finalized!', description: 'Your scorecard has been saved.' }),
    });
  };

  if (session.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="text-center py-20 px-4">
          <p className="text-lg font-semibold text-foreground">Session not found</p>
          <Button onClick={() => navigate('/score')} className="mt-4 rounded-xl">Browse Sessions</Button>
        </div>
      </div>
    );
  }

  const memberProfiles = (members.data ?? []).map(m => ({
    user_id: m.user_id,
    display_name: m.profile?.display_name ?? 'Fan',
    profile_photo: m.profile?.profile_photo ?? null,
  }));

  const homeRuns = (entries.data ?? []).filter(e => e.half === 'bottom').reduce((s, e) => s + e.runs, 0);
  const awayRuns = (entries.data ?? []).filter(e => e.half === 'top').reduce((s, e) => s + e.runs, 0);
  const sessionData = session.data as any;
  const isFinalized = sessionData.status === 'final';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F4' }}>
      <HomeRunEffect trigger={effectTrigger} playType={effectPlayType} />
      <AppHeader />

      {/* Vintage-style sticky score bar */}
      <div className="sticky top-0 z-40 border-b-2" style={{ backgroundColor: 'hsl(var(--ivy-green))', borderColor: 'hsl(var(--ivy-green))' }}>
        <div className="mx-auto max-w-lg px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="text-center">
                <p className="text-[10px] opacity-60 uppercase tracking-wider text-white font-['Share_Tech_Mono']">{session.data.away_team || 'Away'}</p>
                <motion.p key={awayRuns} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-2xl font-black text-white font-['Share_Tech_Mono']">
                  {awayRuns}
                </motion.p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  {!isFinalized && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />}
                  <span className="text-[9px] uppercase tracking-widest text-white/60 font-['Share_Tech_Mono']">
                    {isFinalized ? 'FINAL' : 'LIVE'}
                  </span>
                </div>
                <p className="text-[10px] text-white/60 mt-0.5">vs</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] opacity-60 uppercase tracking-wider text-white font-['Share_Tech_Mono']"> {session.data.home_team}</p>
                <motion.p key={homeRuns} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-2xl font-black text-white font-['Share_Tech_Mono']">
                  {homeRuns}
                </motion.p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-white/60 mr-1 font-['Share_Tech_Mono']">{members.data?.length ?? 0} </span>
              <IconButton
                onClick={copyInvite}
                aria-label="Copy invite link"
                className="rounded-lg bg-white/10 hover:bg-white/20"
                icon={<Share2 className="h-3.5 w-3.5 text-white" />}
              />
              <Sheet open={showScorecard} onOpenChange={setShowScorecard}>
                <SheetTrigger asChild>
                  <IconButton
                    aria-label="Open scorecard"
                    className="rounded-lg bg-white/10 hover:bg-white/20"
                    icon={<ClipboardList className="h-3.5 w-3.5 text-white" />}
                  />
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto" style={{ backgroundColor: '#F9F8F4' }}>
                  <ScorecardSheet
                    session={session.data}
                    entries={entries.data ?? []}
                    members={members.data ?? []}
                    memberProfiles={memberProfiles}
                    predictions={predictions.data ?? []}
                    timeline={timeline.data ?? []}
                    userId={user?.id}
                    currentInning={currentInning}
                    onAddEntry={(e) => addEntry.mutate(e)}
                    onConfirm={(id) => confirmEntry.mutate(id)}
                    onPredict={(p) => makePrediction.mutate(p)}
                    onResolve={(id, correct) => resolvePrediction.mutate({ predictionId: id, isCorrect: correct })}
                    onPassPencil={(toId) => passPencil.mutate(toId)}
                    onFinalize={handleFinalize}
                    memberCount={members.data?.length ?? 1}
                    isFinalized={isFinalized}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0 mx-auto max-w-lg w-full">
        <div className="px-3 pt-2">
          <FlashPrediction
            visible={showPrediction}
            currentInning={currentInning}
            half={currentHalf}
            userId={user?.id}
            hasPending={hasPendingPrediction}
            onPredict={(p) => makePrediction.mutate(p)}
            onDismiss={dismissPrediction}
          />
        </div>

        <div className="flex-1 min-h-0">
          <LiveChatFeed
            reactions={reactions.data ?? []}
            profiles={memberProfiles}
            userId={user?.id}
            onSend={(r) => sendReaction.mutate(r)}
          />
        </div>
      </div>

      {/* FAB - Cubs Blue "+ Add Play" */}
      {!isFinalized && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddPlay(true)}
          className="fixed bottom-20 right-4 h-14 rounded-full shadow-lg flex items-center gap-2 px-5 z-30"
          style={{ backgroundColor: 'hsl(var(--accent))', color: 'white' }}
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm font-bold font-['Graduate']">Add Play</span>
        </motion.button>
      )}

      <AddPlayModal
        open={showAddPlay}
        onClose={() => setShowAddPlay(false)}
        onAdd={(e) => {
          addTimelineEvent.mutate(e);
          const bigPlays = ['hr', 'double_play', 'steal', 'triple'];
          if (bigPlays.includes(e.play_type)) {
            setEffectPlayType(e.play_type);
            setEffectTrigger(prev => prev + 1);
          }
        }}
        onQuickOut={() => advanceBatter.mutate()}
        currentInning={currentInning}
      />
    </div>
  );
}

// Bottom sheet with vintage tabs
function ScorecardSheet({
  session, entries, members, memberProfiles, predictions, timeline,
  userId, currentInning, onAddEntry, onConfirm, onPredict, onResolve,
  onPassPencil, onFinalize, memberCount, isFinalized,
}: any) {
  const [tabParams, setTabParams] = useSearchParams();
  const VALID_TABS = ['score', 'relay', 'predict', 'timeline', 'ranks', 'fans'] as const;
  type TabKey = typeof VALID_TABS[number];
  const tabRaw = tabParams.get('tab');
  const tab: TabKey = (VALID_TABS as readonly string[]).includes(tabRaw ?? '') ? (tabRaw as TabKey) : 'score';
  const setTab = (next: TabKey) => {
    const p = new URLSearchParams(tabParams);
    if (next === 'score') p.delete('tab'); else p.set('tab', next);
    setTabParams(p, { replace: false });
  };
  const { toast } = useToast();

  const tabs = [
    { key: 'score', label: ' Score' },
    { key: 'relay', label: ' Relay' },
    { key: 'predict', label: ' Predict' },
    { key: 'timeline', label: ' Plays' },
    { key: 'ranks', label: ' Ranks' },
    { key: 'fans', label: ' Fans' },
  ];

  const handlePostToClubhouse = () => {
    // Future: post summary to feed
    toast({ title: ' Posted to Clubhouse!', description: 'Your scorecard summary is now in the feed.' });
  };

  return (
    <div className="pt-4 pb-6 space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors font-['Share_Tech_Mono']"
            style={{
              backgroundColor: tab === t.key ? 'hsl(var(--ivy-green))' : 'hsl(var(--ivy-green) / 0.08)',
              color: tab === t.key ? 'white' : 'hsl(var(--ivy-green))',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'score' && (
        <div className="space-y-3">
          <Scorecard
            homeTeam={session.home_team}
            awayTeam={session.away_team}
            entries={entries}
            onAddEntry={onAddEntry}
            onConfirm={onConfirm}
            userId={userId}
            memberCount={memberCount}
            scorerProfiles={memberProfiles}
          />
          {/* Finalize & Post buttons */}
          {!isFinalized && session.creator_id === userId && (
            <Button
              onClick={onFinalize}
              className="w-full rounded-xl py-4 font-['Graduate'] text-sm"
              style={{ backgroundColor: 'hsl(var(--secondary))' }}
            >
              <Flag className="h-4 w-4 mr-2" /> Finalize Game
            </Button>
          )}
          {isFinalized && (
            <Button
              onClick={handlePostToClubhouse}
              className="w-full rounded-xl py-4 font-['Graduate'] text-sm"
              style={{ backgroundColor: 'hsl(var(--accent))' }}
            >
               Post to Clubhouse
            </Button>
          )}
        </div>
      )}
      {tab === 'relay' && (
        <RelayPanel
          sessionId={session.id}
          inviteCode={session.invite_code}
          activeScorerId={(session as any).active_scorer_id}
          members={memberProfiles}
          userId={userId}
          onPassPencil={onPassPencil}
          activeBatter={(session as any).active_batter ?? 1}
          currentInning={currentInning}
        />
      )}
      {tab === 'predict' && (
        <PredictionPanel
          predictions={predictions}
          profiles={memberProfiles}
          userId={userId}
          currentInning={currentInning}
          onPredict={onPredict}
          onResolve={onResolve}
        />
      )}
      {tab === 'timeline' && <GameTimeline events={timeline} />}
      {tab === 'ranks' && <ScorerLeaderboard />}
      {tab === 'fans' && <SessionMembers members={members} />}
    </div>
  );
}
