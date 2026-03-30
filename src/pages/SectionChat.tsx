import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Users, MessageCircle, Loader2 } from 'lucide-react';
import { QuickBlockButton } from '@/components/QuickBlockButton';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useActiveGameForChat, useSectionMessages, useSendSectionMessage, useSectionMembers } from '@/hooks/useSectionChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useVerifiedFan } from '@/hooks/useVerifiedFan';
import { VerifiedGate } from '@/components/VerifiedGate';

export default function SectionChat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { isVerified, isLoading: verifyLoading } = useVerifiedFan();
  const { data: activeGame, isLoading: gameLoading } = useActiveGameForChat();
  const section = profile?.wrigley_section;
  const { data: messages = [], isLoading: msgsLoading } = useSectionMessages(activeGame?.id, section ?? undefined);
  const { data: members = [] } = useSectionMembers(activeGame?.id, section ?? undefined);
  const sendMessage = useSendSectionMessage();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!draft.trim() || !activeGame?.id || !section) return;
    sendMessage.mutate({ gameId: activeGame.id, section, body: draft });
    setDraft('');
  };

  // Verified gate
  if (!verifyLoading && !isVerified) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <VerifiedGate featureName="Section Chat" />
      </div>
    );
  }

  // No section set
  if (!section) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center pt-20 px-6 text-center">
          <p className="text-5xl mb-4">🏟️</p>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Set Your Section First
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Head to Game Day Setup and enter your seat section to join your Section Chat.
          </p>
          <Button onClick={() => navigate('/game-day')} className="rounded-xl">
            Go to Game Day
          </Button>
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
          <p className="text-5xl mb-4">📅</p>
          <h2 className="text-xl font-bold text-foreground mb-2">
            No Game Today
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Section Chats open up when there's a game on. Check back on game day!
          </p>
        </div>
      </div>
    );
  }

  if (gameLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />

      {/* Chat header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏟️</span>
              <h2 className="text-base font-bold text-foreground truncate">
                Section {section} Chat
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              <span className="text-[11px] text-muted-foreground">
                {activeGame?.opponent ? `vs ${activeGame.opponent}` : 'Game Day'} · {members.length} {members.length === 1 ? 'fan' : 'fans'} here
              </span>
            </div>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <Avatar key={m.user_id} className="h-7 w-7 border-2 border-card">
                <AvatarImage src={m.profile_photo || undefined} />
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgsLoading ? (
          <div className="flex items-center justify-center pt-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to rally your section!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              const member = members.find((m) => m.user_id === msg.sender_id);
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
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card border border-border text-foreground rounded-bl-md'
                      }`}
                    >
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
      <div className="border-t border-border bg-card px-4 py-3 pb-6 safe-area-bottom">
        <div className="flex gap-2">
          <Input
            placeholder={`Message Section ${section}…`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            maxLength={500}
            className="rounded-xl flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sendMessage.isPending}
            size="icon"
            className="rounded-xl h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
