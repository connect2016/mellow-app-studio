import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Scorecard } from '@/components/scoring/Scorecard';
import { SessionChat } from '@/components/scoring/SessionChat';
import { GameTimeline } from '@/components/scoring/GameTimeline';
import { AddPlayModal } from '@/components/scoring/AddPlayModal';
import { SessionMembers } from '@/components/scoring/SessionMembers';
import { PredictionPanel } from '@/components/scoring/PredictionPanel';
import { ScorerLeaderboard } from '@/components/scoring/ScorerLeaderboard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useScoringSession } from '@/hooks/useScoringSession';
import { useProfile } from '@/hooks/useProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Share2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ScoreGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const [showAddPlay, setShowAddPlay] = useState(false);
  const [currentInning, setCurrentInning] = useState(1);

  const {
    session, members, entries, timeline, reactions,
    joinSession, addEntry, confirmEntry, addTimelineEvent, sendReaction,
  } = useScoringSession(id);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Auto-join on first visit
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

  // Track current inning from entries
  useEffect(() => {
    if (entries.data && entries.data.length > 0) {
      const maxInning = Math.max(...entries.data.map(e => e.inning));
      setCurrentInning(maxInning);
    }
  }, [entries.data]);

  const copyInvite = () => {
    if (!session.data) return;
    const url = `${window.location.origin}/score/${id}`;
    navigator.clipboard.writeText(url);
    toast({ title: '🔗 Link copied!', description: 'Share this with friends to join the session' });
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      {/* Score header */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-lg px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-xs opacity-75">{session.data.away_team || 'Away'}</p>
              <p className="text-3xl font-bold">{awayRuns}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-[10px] uppercase tracking-wider opacity-60">
                {session.data.status === 'live' ? 'LIVE' : 'FINAL'}
              </p>
              <p className="text-xs font-medium opacity-75 mt-1">vs</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs opacity-75">🐻 {session.data.home_team}</p>
              <p className="text-3xl font-bold">{homeRuns}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[11px] opacity-75">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              {members.data?.length ?? 0} fans scoring
            </span>
            <button onClick={copyInvite} className="flex items-center gap-1 text-[11px] opacity-75 hover:opacity-100">
              <Share2 className="h-3 w-3" /> Invite
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-4 space-y-4">
        {/* Invite code */}
        {session.data.invite_code && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs"
          >
            <span className="text-muted-foreground">Invite code:</span>
            <code className="font-mono font-bold text-foreground">{session.data.invite_code}</code>
            <button onClick={copyInvite} className="ml-auto text-primary"><Copy className="h-3.5 w-3.5" /></button>
          </motion.div>
        )}

        {/* Scorecard */}
        <Scorecard
          homeTeam={session.data.home_team}
          awayTeam={session.data.away_team}
          entries={entries.data ?? []}
          onAddEntry={(e) => addEntry.mutate(e)}
          onConfirm={(id) => confirmEntry.mutate(id)}
          userId={user?.id}
          memberCount={members.data?.length ?? 1}
        />

        {/* Add Play button */}
        <Button
          onClick={() => setShowAddPlay(true)}
          variant="outline"
          className="w-full rounded-xl border-dashed border-2 py-5"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Key Play
        </Button>

        {/* Tabs: Chat / Timeline / Members */}
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="w-full rounded-xl bg-muted/50">
            <TabsTrigger value="chat" className="flex-1 rounded-lg text-xs">💬 Chat</TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1 rounded-lg text-xs">⚾ Timeline</TabsTrigger>
            <TabsTrigger value="members" className="flex-1 rounded-lg text-xs">👥 Fans</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="mt-3">
            <SessionChat
              reactions={reactions.data ?? []}
              profiles={memberProfiles}
              userId={user?.id}
              onSend={(r) => sendReaction.mutate(r)}
            />
          </TabsContent>
          <TabsContent value="timeline" className="mt-3">
            <GameTimeline events={timeline.data ?? []} />
          </TabsContent>
          <TabsContent value="members" className="mt-3">
            <SessionMembers members={members.data ?? []} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Play Modal */}
      <AddPlayModal
        open={showAddPlay}
        onClose={() => setShowAddPlay(false)}
        onAdd={(e) => addTimelineEvent.mutate(e)}
        currentInning={currentInning}
      />
    </div>
  );
}
