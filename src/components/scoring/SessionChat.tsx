import { useState, useRef, useEffect } from 'react';
import { Send, SmilePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ReactionBar } from '@/components/reactions/ReactionBar';
import { ReactionPicker } from '@/components/reactions/ReactionPicker';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { getReactionFromBody } from '@/components/reactions/reactionData';

interface Reaction {
  id: string;
  user_id: string;
  type: string;
  body: string;
  created_at: string;
}

interface MemberProfile {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
}

interface SessionChatProps {
  reactions: Reaction[];
  profiles: MemberProfile[];
  userId?: string;
  onSend: (reaction: { type: string; body: string }) => void;
}

export function SessionChat({ reactions, profiles, userId, onSend }: SessionChatProps) {
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [reactions.length]);

  const getProfile = (uid: string) => profiles.find(p => p.user_id === uid);

  const handleSend = () => {
    if (!message.trim()) return;
    onSend({ type: 'chat', body: message.trim() });
    setMessage('');
  };

  const handleReaction = (r: { type: string; body: string; key: string }) => {
    onSend({ type: r.type, body: r.body });
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col" style={{ height: 360 }}>
      {/* Realistic reaction bar at top */}
      <ReactionBar onReact={handleReaction} />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {reactions.map(r => {
          const profile = getProfile(r.user_id);
          const isMe = r.user_id === userId;
          const isReaction = r.type === 'reaction';
          const matchedReaction = isReaction ? getReactionFromBody(r.body) : undefined;

          return (
            <div
              key={r.id}
              className={`flex gap-2 animate-fade-in ${isMe ? 'flex-row-reverse' : ''}`}
            >
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                {profile?.profile_photo ? (
                  <img src={profile.profile_photo} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {profile?.display_name?.charAt(0) ?? '?'}
                  </div>
                )}
              </div>
              <div className={`max-w-[75%] ${isMe ? 'text-right' : ''}`}>
                <p className="text-[10px] text-muted-foreground mb-0.5">{profile?.display_name ?? 'Fan'}</p>
                {isReaction && matchedReaction ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-secondary/10 border border-secondary/20 animate-scale-in">
                    <RealisticEmoji src={matchedReaction.image} alt={matchedReaction.label} size="sm" animate />
                    <span className="text-secondary font-semibold text-xs sm:text-sm">{matchedReaction.shortText}</span>
                  </div>
                ) : (
                  <div className={`inline-block px-3 py-2 rounded-2xl text-xs sm:text-sm ${
                    isReaction
                      ? 'bg-secondary/10 text-secondary font-semibold'
                      : isMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                  }`}>
                    {r.body}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {reactions.length === 0 && (
          <div className="text-center text-xs sm:text-sm text-muted-foreground py-8">
            The press box is quiet — be the first to call the play!
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-border flex gap-2">
        <ReactionPicker onReact={handleReaction}>
          <button className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <SmilePlus className="h-5 w-5 text-muted-foreground" />
          </button>
        </ReactionPicker>
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="rounded-xl text-sm h-12"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all duration-150"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
