import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Users, MessageCircle, Loader2, MapPin, Shield } from 'lucide-react';
import { QuickBlockButton } from '@/components/QuickBlockButton';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useActiveGameForChat, useSectionMessages, useSendSectionMessage, useSectionMembers } from '@/hooks/useSectionChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useVerifiedFan } from '@/hooks/useVerifiedFan';
import { VerifiedGate } from '@/components/VerifiedGate';
import { useGeofence } from '@/hooks/useGeofence';
import { GameTriggerAnimation, useGameTrigger, detectGameTrigger } from '@/components/GameTriggerAnimation';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export default function SectionChat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { isVerified, isLoading: verifyLoading } = useVerifiedFan();
  const { data: activeGame, isLoading: gameLoading } = useActiveGameForChat();
  const { nearWrigley, checking: geoChecking, recheckLocation } = useGeofence();
  const section = profile?.wrigley_section;
  const { data: messages = [], isLoading: msgsLoading } = useSectionMessages(activeGame?.id, section ?? undefined);
  const { data: members = [] } = useSectionMembers(activeGame?.id, section ?? undefined);
  const sendMessage = useSendSectionMessage();
  const [draft, setDraft] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { activeTrigger, checkAndTrigger, clearTrigger } = useGameTrigger();

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Check incoming messages for game triggers
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && Date.now() - new Date(lastMsg.created_at).getTime() < 5000) {
        checkAndTrigger(lastMsg.body);
      }
    }
  }, [messages.length, checkAndTrigger]);

  // Auto-prompt to join squad when geofenced inside stadium
  useEffect(() => {
    if (nearWrigley === true && section && !hasJoined && user) {
      setHasJoined(true);
      toast.success(`Welcome to Section ${section} Squad! `, {
        description: 'You\'re inside Wrigley — your squad chat is live.',
        duration: 5000,
      });
    }
  }, [nearWrigley, section, hasJoined, user]);

  const handleSend = () => {
    if (!draft.trim() || !activeGame?.id || !section) return;

    // Check for game trigger on send
    checkAndTrigger(draft);

    sendMessage.mutate({ gameId: activeGame.id, section, body: draft });
    setDraft('');
  };

  const isSystemMessage = (body: string) => {
    return body.startsWith('[SYSTEM]') || body.startsWith('') || body.startsWith('');
  };

  // Verified gate
  if (!verifyLoading && !isVerified) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <VerifiedGate featureName="Section Squads" />
      </div>
    );
  }

  // No section set
  if (!section) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center pt-20 px-6 text-center">
          <p className="text-5xl mb-4"></p>
          <h2 className="text-xl font-bold text-destructive-foreground mb-2" style={{ fontFamily: "'Rye', cursive" }}>
            Set Your Section
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Enter your seat section in Game Day Setup to join your Section Squad.
          </p>
          <Button onClick={() => navigate('/game-day')} className="rounded-xl">
            Go to Game Day
          </Button>
        </div>
      </div>
    );
  }

  // Geofence check — not at Wrigley
  if (nearWrigley === false && !geoChecking) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center pt-20 px-6 text-center">
          <p className="text-5xl mb-4"></p>
          <h2 className="text-xl font-bold text-destructive-foreground mb-2" style={{ fontFamily: "'Rye', cursive" }}>
            Get to the Ballpark!
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            Section Squads are geofenced — you need to be inside or near Wrigley Field to join your squad.
          </p>
          <div className="flex gap-2">
            <Button onClick={recheckLocation} variant="outline" className="rounded-xl gap-1.5">
              <MapPin className="h-4 w-4" />
              Re-check Location
            </Button>
            <Button onClick={() => navigate(-1)} variant="ghost" className="rounded-xl">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No active game
  if (!gameLoading && !activeGame) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center pt-20 px-6 text-center">
          <p className="text-5xl mb-4"></p>
          <h2 className="text-xl font-bold text-destructive-foreground mb-2" style={{ fontFamily: "'Rye', cursive" }}>
            No Game Today
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Section Squads activate on game day. Check back when the Cubs are playing!
          </p>
        </div>
      </div>
    );
  }

  if (gameLoading || geoChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-scoreboard uppercase tracking-wider">
          {geoChecking ? 'Checking location...' : 'Loading game...'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />

      {/* Game Trigger Animation Overlay */}
      <GameTriggerAnimation trigger={activeTrigger} onComplete={clearTrigger} />

      {/* Squad Header */}
      <div
        className="border-b-2 px-4 py-3"
        style={{
          borderColor: 'hsl(var(--day-blue) / 0.3)',
          background: 'linear-gradient(135deg, hsl(var(--day-blue) / 0.08), hsl(var(--ivy-green) / 0.05))',
        }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg"></span>
              <h2
                className="text-base font-bold text-foreground truncate"
                style={{ fontFamily: "'Rye', cursive" }}
              >
                Section {section} Squad
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              <span className="text-[11px] font-scoreboard text-muted-foreground uppercase tracking-wider">
                {activeGame?.opponent ? `vs ${activeGame.opponent}` : 'Game Day'} · {members.length} {members.length === 1 ? 'fan' : 'fans'}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{
                  background: 'hsl(var(--ivy-green) / 0.12)',
                  color: 'hsl(var(--ivy-green))',
                }}
              >
                <Shield className="h-2.5 w-2.5" /> Geofenced
              </span>
            </div>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <Avatar key={m.user_id} className="h-7 w-7 border-2 border-card">
                <AvatarImage src={m.profile_photo || undefined} />
                <AvatarFallback
                  className="text-[10px] font-bold"
                  style={{ background: 'hsl(var(--day-blue))', color: 'white' }}
                >
                  {m.display_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            ))}
            {members.length > 4 && (
              <div className="h-7 w-7 rounded-full border-2 border-card bg-muted flex items-center justify-center">
                <span className="text-[9px] font-bold text-muted-foreground">+{members.length - 4}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game trigger hints */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/30 border-b border-border text-[9px] font-scoreboard text-muted-foreground uppercase tracking-wider overflow-x-auto scrollbar-hide">
        <span> Try typing:</span>
        {['HR', 'Home Run', 'Fly the W', 'Strikeout'].map((hint) => (
          <span
            key={hint}
            className="inline-flex items-center rounded-full px-2 py-0.5 border border-border bg-card whitespace-nowrap"
          >
            {hint}
          </span>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgsLoading ? (
          <div className="flex items-center justify-center pt-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">Squad assembled!</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to rally Section {section}!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              const isSys = isSystemMessage(msg.body);
              const member = members.find((m) => m.user_id === msg.sender_id);
              const hasTrigger = detectGameTrigger(msg.body);

              // System messages
              if (isSys) {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center"
                  >
                    <div
                      className="rounded-xl px-4 py-2 text-xs font-medium text-center max-w-[85%]"
                      style={{
                        background: 'hsl(var(--ivy-green) / 0.12)',
                        color: 'hsl(var(--ivy-green))',
                        border: '1px solid hsl(var(--ivy-green) / 0.2)',
                      }}
                    >
                      {msg.body}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  {!isMe && (
                    <Avatar className="h-7 w-7 shrink-0 mt-1">
                      <AvatarImage src={member?.profile_photo || undefined} />
                      <AvatarFallback className="text-[10px] bg-muted">{member?.display_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <div className="flex items-center gap-1 mb-0.5 px-1">
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          {member?.display_name || 'Fan'}
                        </p>
                        <QuickBlockButton
                          targetUserId={msg.sender_id}
                          targetName={member?.display_name}
                        />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        isMe ? 'rounded-br-md' : 'rounded-bl-md'
                      } ${hasTrigger ? 'ring-2 ring-offset-1' : ''}`}
                      style={
                        isMe
                          ? {
                              background: 'hsl(var(--day-blue))',
                              color: 'white',
                              ...(hasTrigger ? { ringColor: 'hsl(var(--day-blue) / 0.5)' } : {}),
                            }
                          : {
                              background: 'hsl(var(--card))',
                              color: 'hsl(var(--card-foreground))',
                              border: '1px solid hsl(var(--border))',
                            }
                      }
                    >
                      {hasTrigger && (
                        <span className="text-base mr-1"><ConceptIcon name={hasTrigger.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
                      )}
                      {msg.body}
                    </div>
                    <p className={`text-[9px] text-muted-foreground mt-0.5 px-1 ${isMe ? 'text-right' : ''}`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div
        className="border-t-2 px-4 py-3 pb-6 safe-area-bottom"
        style={{
          borderColor: 'hsl(var(--day-blue) / 0.15)',
          background: 'hsl(var(--card))',
        }}
      >
        <div className="flex gap-2">
          <Input
            placeholder={`Rally Section ${section}…`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            maxLength={500}
            className="rounded-xl flex-1"
            style={{ borderColor: 'hsl(var(--day-blue) / 0.2)' }}
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sendMessage.isPending}
            size="icon"
            className="rounded-xl h-10 w-10 shrink-0"
            style={{
              background: 'hsl(var(--day-blue))',
              color: 'white',
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
