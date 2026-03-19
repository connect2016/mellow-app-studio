import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  { emoji: '🔥', text: "Let's go Cubs!" },
  { emoji: '😤', text: 'What was that call??' },
  { emoji: '⚡', text: 'Strikeout!' },
  { emoji: '👏', text: 'Double play!' },
  { emoji: '😱', text: 'No way!' },
];

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

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col" style={{ height: 320 }}>
      {/* Quick reactions */}
      <div className="flex gap-1.5 px-3 py-2.5 border-b border-border overflow-x-auto">
        {QUICK_REACTIONS.map(r => (
          <button
            key={r.text}
            onClick={() => onSend({ type: 'reaction', body: `${r.emoji} ${r.text}` })}
            className="flex-shrink-0 px-2.5 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium text-foreground hover:bg-primary/10 transition-colors"
          >
            {r.emoji} {r.text}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        <AnimatePresence initial={false}>
          {reactions.map(r => {
            const profile = getProfile(r.user_id);
            const isMe = r.user_id === userId;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                <div className="h-6 w-6 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {profile?.profile_photo ? (
                    <img src={profile.profile_photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {profile?.display_name?.charAt(0) ?? '?'}
                    </div>
                  )}
                </div>
                <div className={`max-w-[75%] ${isMe ? 'text-right' : ''}`}>
                  <p className="text-[10px] text-muted-foreground mb-0.5">{profile?.display_name ?? 'Fan'}</p>
                  <div className={`inline-block px-3 py-1.5 rounded-2xl text-xs ${
                    r.type === 'reaction'
                      ? 'bg-secondary/10 text-secondary font-semibold'
                      : isMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                  }`}>
                    {r.body}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {reactions.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8">
            No messages yet — be the first to react! ⚾
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-border flex gap-2">
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="rounded-xl text-sm h-9"
        />
        <button onClick={handleSend} disabled={!message.trim()} className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
