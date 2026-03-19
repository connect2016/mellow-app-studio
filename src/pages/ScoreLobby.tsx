import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useScoringSessions } from '@/hooks/useScoringSession';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Radio, ArrowRight } from 'lucide-react';

export default function ScoreLobby() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { liveSessions, createSession } = useScoringSessions();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const handleCreate = () => {
    if (!title.trim()) return;
    createSession.mutate(
      { title: title.trim(), away_team: awayTeam.trim() },
      {
        onSuccess: (data) => {
          toast({ title: '⚾ Session created!' });
          navigate(`/score/${data.id}`);
        },
      }
    );
  };

  const handleJoinByCode = () => {
    // For now, join codes map to session IDs or invite codes
    // We'd search by invite_code
    toast({ title: 'Looking for session...' });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      <div className="mx-auto max-w-lg px-4 pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">⚾ Score Together</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track the game with other Cubs fans in real time
          </p>
        </div>

        {/* Create / Join */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button onClick={() => setShowCreate(!showCreate)} className="rounded-xl py-5 flex flex-col gap-1 h-auto">
            <Plus className="h-5 w-5" />
            <span className="text-xs">Start Session</span>
          </Button>
          <div className="flex gap-1.5">
            <Input
              placeholder="Invite code"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              className="rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Create form */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-2xl border border-border bg-card p-4 mb-6 space-y-3 shadow-sm"
          >
            <Input
              placeholder="Session title (e.g. Cubs vs Cardinals)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="rounded-xl"
            />
            <Input
              placeholder="Opponent (e.g. Cardinals)"
              value={awayTeam}
              onChange={e => setAwayTeam(e.target.value)}
              className="rounded-xl"
            />
            <Button onClick={handleCreate} disabled={!title.trim() || createSession.isPending} className="w-full rounded-xl">
              {createSession.isPending ? 'Creating...' : '🎬 Create & Start'}
            </Button>
          </motion.div>
        )}

        {/* Live sessions */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <h2 className="text-lg font-bold text-foreground">Live Sessions</h2>
          </div>

          {liveSessions.isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {liveSessions.data && liveSessions.data.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <Radio className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No live sessions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to start scoring!</p>
            </div>
          )}

          <div className="space-y-2">
            {liveSessions.data?.map((s, i) => {
              const memberCount = (s as any).scoring_session_members?.[0]?.count ?? 0;
              return (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/score/${s.id}`)}
                  className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-all shadow-sm"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">⚾</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {memberCount} fans</span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live
                      </span>
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
