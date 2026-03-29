import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { QuickBlockButton } from '@/components/QuickBlockButton';
import { useLineupMessages, useSendLineupMessage, LineupMeetup } from '@/hooks/useLineup';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LineupChatProps {
  meetup: LineupMeetup;
  open: boolean;
  onClose: () => void;
}

export function LineupChat({ meetup, open, onClose }: LineupChatProps) {
  const { user } = useAuth();
  const { data: messages = [] } = useLineupMessages(open ? meetup.id : null);
  const sendMessage = useSendLineupMessage();
  const [body, setBody] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody('');
    await sendMessage.mutateAsync({ meetupId: meetup.id, body: trimmed });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl border-t bg-card shadow-2xl flex flex-col"
            style={{ height: '70vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground truncate" style={{ fontFamily: 'Rye, serif' }}>
                  📋 {meetup.location_name}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {meetup.member_count} fan{meetup.member_count !== 1 ? 's' : ''} in this meetup
                </p>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-3xl mb-2">⚾</p>
                  <p className="text-sm font-semibold text-foreground">The dugout's empty</p>
                  <p className="text-xs text-muted-foreground">Be the first to say something!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      <img
                        src={msg.sender_photo || '/placeholder.svg'}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover shrink-0 mt-0.5"
                      />
                      <div className={`max-w-[75%] ${isMe ? 'text-right' : ''}`}>
                        <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                          {isMe ? 'You' : msg.sender_name}
                        </p>
                        <div
                          className={`rounded-2xl px-3 py-2 text-sm ${
                            isMe
                              ? 'bg-lineup text-lineup-foreground rounded-tr-md'
                              : 'bg-muted text-foreground rounded-tl-md'
                          }`}
                        >
                          {msg.body}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border px-4 py-3 flex gap-2 shrink-0">
              <Input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Say something..."
                className="rounded-full flex-1"
                maxLength={500}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!body.trim() || sendMessage.isPending}
                className="rounded-full bg-lineup text-lineup-foreground hover:bg-lineup/90 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
