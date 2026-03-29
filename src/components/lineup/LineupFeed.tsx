import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Clock, Users, MessageCircle, LogOut } from 'lucide-react';
import { useLineupMeetups, useJoinMeetup, useLeaveMeetup, LineupMeetup } from '@/hooks/useLineup';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CreateMeetupModal } from './CreateMeetupModal';
import { LineupChat } from './LineupChat';
import { SafetyTimerModal } from '@/components/SafetyTimerModal';
import { toast } from 'sonner';

function formatMeetupTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 0) return 'Now';
  if (diffMins < 60) return `in ${diffMins}m`;
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `in ${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
}

function formatAbsTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function LineupFeed() {
  const { user } = useAuth();
  const { data: meetups = [], isLoading } = useLineupMeetups();
  const joinMeetup = useJoinMeetup();
  const leaveMeetup = useLeaveMeetup();
  const [showCreate, setShowCreate] = useState(false);
  const [chatMeetup, setChatMeetup] = useState<LineupMeetup | null>(null);
  const [safetyMeetup, setSafetyMeetup] = useState<LineupMeetup | null>(null);

  const handleJoin = async (meetup: LineupMeetup) => {
    if (meetup.member_count && meetup.member_count >= meetup.max_members) {
      toast.error('This meetup is full!');
      return;
    }
    try {
      await joinMeetup.mutateAsync(meetup.id);
      toast.success("⚾ You're in! Check the group chat.");
      setChatMeetup({ ...meetup, is_member: true, member_count: (meetup.member_count ?? 1) + 1 });
    } catch {
      toast.error('Could not join meetup');
    }
  };

  const handleLeave = async (meetupId: string) => {
    try {
      await leaveMeetup.mutateAsync(meetupId);
      toast('Left the meetup');
      if (chatMeetup?.id === meetupId) setChatMeetup(null);
    } catch {
      toast.error('Could not leave meetup');
    }
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-foreground" style={{ fontFamily: 'Rye, serif' }}>
            📋 The Lineup
          </h3>
          <p className="text-[11px] text-muted-foreground">Public meetups happening now</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          className="rounded-full gap-1.5 bg-lineup text-lineup-foreground hover:bg-lineup/90 font-semibold"
        >
          <Plus className="h-4 w-4" /> Post
        </Button>
      </div>

      {/* Meetup cards */}
      {isLoading ? (
        <div className="py-8 text-center">
          <p className="text-2xl animate-pulse">⚾</p>
          <p className="text-xs text-muted-foreground mt-1">Loading the lineup...</p>
        </div>
      ) : meetups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-dashed border-lineup/30 bg-lineup/5 p-6 text-center"
        >
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm font-semibold text-foreground">The bleachers are empty.</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to start a rally.</p>
          <Button
            size="sm"
            onClick={() => setShowCreate(true)}
            className="mt-3 rounded-full gap-1.5 bg-lineup text-lineup-foreground hover:bg-lineup/90"
          >
            <Plus className="h-4 w-4" /> Post a Meetup
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {meetups.map((meetup, i) => {
              const isCreator = meetup.creator_id === user?.id;
              const isFull = (meetup.member_count ?? 0) >= meetup.max_members;

              return (
                <motion.div
                  key={meetup.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  {/* Creator info */}
                  <div className="flex items-start gap-3">
                    <img
                      src={meetup.creator_photo || '/placeholder.svg'}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover border-2 border-lineup/30"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        <span className="text-lineup">{meetup.creator_name}</span> is heading to{' '}
                        <span className="font-bold">{meetup.location_name}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatAbsTime(meetup.meeting_time)} ({formatMeetupTime(meetup.meeting_time)})
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {meetup.member_count}/{meetup.max_members}
                        </span>
                      </div>
                      {meetup.description && (
                        <p className="mt-2 text-xs text-foreground/80 italic leading-relaxed">"{meetup.description}"</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                    {meetup.is_member || isCreator ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setChatMeetup(meetup)}
                          className="flex-1 rounded-full gap-1.5 bg-lineup text-lineup-foreground hover:bg-lineup/90 font-semibold"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Group Chat
                        </Button>
                        {!isCreator && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLeave(meetup.id)}
                            className="rounded-full gap-1 text-muted-foreground"
                          >
                            <LogOut className="h-3.5 w-3.5" /> Leave
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleJoin(meetup)}
                        disabled={isFull || joinMeetup.isPending}
                        className="flex-1 rounded-full font-bold text-base h-10 bg-lineup text-lineup-foreground hover:bg-lineup/90 shadow-[0_0_16px_hsl(var(--lineup-teal)/0.3)] transition-all active:scale-95"
                      >
                        {isFull ? 'Full 🚫' : "⚾ I'm In!"}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <CreateMeetupModal open={showCreate} onClose={() => setShowCreate(false)} />
      <LineupChat
        meetup={chatMeetup!}
        open={!!chatMeetup}
        onClose={() => setChatMeetup(null)}
      />
    </div>
  );
}
