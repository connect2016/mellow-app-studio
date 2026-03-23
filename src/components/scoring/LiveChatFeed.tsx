import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';

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

const QUICK_REACTIONS = [
  { emoji: '💣', text: 'HR!!!' },
  { emoji: '🔥', text: "Let's go!" },
  { emoji: '😤', text: 'Bad call!' },
  { emoji: '⚡', text: 'K!' },
  { emoji: '👏', text: 'DP!' },
  { emoji: '😱', text: 'No way!' },
  { emoji: '🐻', text: 'Go Cubs!' },
];

interface LiveChatFeedProps {
  reactions: Reaction[];
  profiles: MemberProfile[];
  userId?: string;
  onSend: (reaction: { type: string; body: string }) => void;
}

export function LiveChatFeed({ reactions, profiles, userId, onSend }: LiveChatFeedProps) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Chat stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        <AnimatePresence initial={false}>
          {reactions.map((r, i) => {
            const profile = getProfile(r.user_id);
            const isMe = r.user_id === userId;
            const isReaction = r.type === 'reaction';

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: isReaction ? 40 : -40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className="h-6 w-6 rounded-full bg-muted overflow-hidden flex-shrink-0 mt-0.5">
                  {profile?.profile_photo ? (
                    <img src={profile.profile_photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                      {profile?.display_name?.charAt(0) ?? '?'}
                    </div>
                  )}
                </div>

                <div className={`max-w-[75%] ${isMe ? 'text-right' : ''}`}>
                  <p className="text-[9px] text-muted-foreground mb-0.5 font-medium">
                    {profile?.display_name ?? 'Fan'}
                  </p>
                  {isReaction ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [0.8, 1.1, 1] }}
                      transition={{ duration: 0.3 }}
                      className="inline-block px-3 py-1.5 rounded-2xl bg-secondary/10 text-secondary font-bold text-sm"
                    >
                      {r.body}
                    </motion.div>
                  ) : (
                    <div className={`inline-block px-3 py-1.5 rounded-2xl text-xs ${
                      isMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      {r.body}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {reactions.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground text-center py-8">
              Be the first to react! ⚾<br />
              <span className="text-[10px]">Tap a reaction or type below</span>
            </p>
          </div>
        )}
      </div>

      {/* Quick reactions strip */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto border-t border-border/50 bg-background/50 backdrop-blur-sm">
        {QUICK_REACTIONS.map(r => (
          <motion.button
            key={r.text}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSend({ type: 'reaction', body: `${r.emoji} ${r.text}` })}
            className="flex-shrink-0 px-2 py-1 rounded-full bg-muted/70 border border-border/50 text-[10px] font-semibold text-foreground hover:bg-primary/10 hover:border-primary/20 transition-colors"
          >
            {r.emoji} {r.text}
          </motion.button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-border flex gap-2 bg-card">
        <input
          placeholder="Type a message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="flex-1 h-9 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!message.trim()}
          className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
        >
          <Send className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}
