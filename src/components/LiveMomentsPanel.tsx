import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLiveMoments, useMyMomentJoins, useCreateMoment, useJoinMoment, useLeaveMoment, MOMENT_PRESETS, LiveMoment } from '@/hooks/useLiveMoments';
import { Radio, Users, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

function CountdownBadge({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const urgent = remaining <= 10;

  return (
    <span className={`text-xs font-mono font-bold tabular-nums ${urgent ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

function MomentCard({ moment, isJoined, onJoin, onLeave }: {
  moment: LiveMoment;
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const participantScale = Math.min(1, moment.participant_count / 20);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative rounded-2xl border p-4 transition-all ${
        isJoined
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
          : 'border-border bg-card hover:border-primary/30'
      }`}
    >
      {/* Participation wave effect */}
      {isJoined && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-primary/5"
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="relative flex items-start gap-3">
        {/* Emoji pulse */}
        <motion.div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl"
          animate={isJoined ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          {moment.emoji}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-sm text-foreground truncate">{moment.title}</h4>
            <CountdownBadge expiresAt={moment.expires_at} />
          </div>

          {/* Participant bar */}
          <div className="mt-2 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(5, participantScale * 100)}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>
            <span className="text-xs font-semibold text-foreground tabular-nums">{moment.participant_count}</span>
          </div>

          {/* Peak indicator */}
          {moment.peak_participants > moment.participant_count && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Peak: {moment.peak_participants} fans
            </p>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="mt-3 relative">
        {isJoined ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full rounded-xl text-xs"
            onClick={onLeave}
          >
            Leave Moment
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full rounded-xl text-xs"
            onClick={onJoin}
          >
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              🤝
            </motion.span>
            Join In!
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function LiveMomentsPanel() {
  const { data: moments = [], isLoading } = useLiveMoments();
  const { data: myJoins = [] } = useMyMomentJoins();
  const createMoment = useCreateMoment();
  const joinMoment = useJoinMoment();
  const leaveMoment = useLeaveMoment();
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleCreate = (preset: typeof MOMENT_PRESETS[number]) => {
    createMoment.mutate(
      { type: preset.type, title: preset.title, emoji: preset.emoji, duration: preset.duration },
      {
        onSuccess: () => {
          toast.success(`${preset.emoji} "${preset.title}" is live!`);
          setShowCreate(false);
        },
      }
    );
  };

  const handleJoin = (momentId: string) => {
    joinMoment.mutate(momentId, {
      onSuccess: () => toast('🤝 You joined the moment!'),
    });
  };

  const handleLeave = (momentId: string) => {
    leaveMoment.mutate(momentId);
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
            <Radio className="h-4 w-4 text-secondary" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm text-foreground">Live Moments</h3>
            <p className="text-[11px] text-muted-foreground">
              {moments.length > 0
                ? `${moments.length} active — sync up!`
                : 'Start a chant or celebration'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {moments.length > 0 && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Active moments */}
              {isLoading ? (
                <div className="text-center py-6 text-sm text-muted-foreground">Loading moments…</div>
              ) : moments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">📣</p>
                  <p className="text-sm text-muted-foreground">No live moments right now</p>
                  <p className="text-xs text-muted-foreground">Be the first to start one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {moments.map((m) => (
                    <MomentCard
                      key={m.id}
                      moment={m}
                      isJoined={myJoins.includes(m.id)}
                      onJoin={() => handleJoin(m.id)}
                      onLeave={() => handleLeave(m.id)}
                    />
                  ))}
                </div>
              )}

              {/* Create button */}
              <AnimatePresence>
                {showCreate ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="grid grid-cols-2 gap-2"
                  >
                    {MOMENT_PRESETS.map((preset) => (
                      <Button
                        key={preset.type}
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs h-auto py-3 flex flex-col items-center gap-1"
                        onClick={() => handleCreate(preset)}
                        disabled={createMoment.isPending}
                      >
                        <span className="text-lg">{preset.emoji}</span>
                        <span className="truncate w-full text-center">{preset.title.split('!')[0]}</span>
                        <span className="text-[10px] text-muted-foreground">{preset.duration}s</span>
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="col-span-2 text-xs text-muted-foreground"
                      onClick={() => setShowCreate(false)}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => setShowCreate(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Start a Moment
                  </Button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
