import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';
import { QuickBlockButton } from '@/components/QuickBlockButton';
import bgWrigleyPlayball from '@/assets/bg-wrigley-playball.png';
import { useAuth } from '@/contexts/AuthContext';
import {
  useConversations,
  useConversationProfiles,
  useConversationMessages,
  useSendMessage,
} from '@/hooks/useMessages';

export default function Messages() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: conversations = [], isLoading } = useConversations();
  const { data: profileMap = {} } = useConversationProfiles(conversations);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const { data: messages = [] } = useConversationMessages(selectedConvoId);
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedConvo = conversations.find(c => c.id === selectedConvoId);
  const otherUserId = selectedConvo
    ? (selectedConvo.participant_a === user?.id ? selectedConvo.participant_b : selectedConvo.participant_a)
    : null;
  const otherProfile = otherUserId ? profileMap[otherUserId] : null;

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConvoId) return;
    sendMessage.mutate({ conversationId: selectedConvoId, body: newMessage.trim() });
    setNewMessage('');
  };

  if (selectedConvoId && selectedConvo) {
    return (
      <div className="relative flex min-h-screen flex-col pb-24">
        <div className="fixed inset-0 z-0" style={{ backgroundImage: `url(${bgWrigleyPlayball})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="fixed inset-0 z-0" style={{ backgroundColor: 'hsla(222, 47%, 11%, 0.25)' }} />
        <div className="relative z-10 flex flex-1 flex-col">
        <AppHeader />
        <div className="mx-auto w-full max-w-lg flex-1 flex flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card/50">
            <button onClick={() => setSelectedConvoId(null)} className="p-1 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            {otherProfile?.profile_photo && (
              <img src={otherProfile.profile_photo} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-border" />
            )}
            <span className="font-semibold text-sm text-foreground flex-1">{otherProfile?.display_name ?? 'Fan'}</span>
            {otherUserId && (
              <QuickBlockButton
                targetUserId={otherUserId}
                targetName={otherProfile?.display_name}
                onBlocked={() => setSelectedConvoId(null)}
              />
            )}
          </div>

          <div className="flex-1 space-y-3 p-4 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <p className="text-3xl mb-3">💬</p>
                <p className="font-semibold text-foreground text-sm">The bases are empty!</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to start a conversation.</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-card border border-border text-foreground rounded-bl-md'
                  }`}>
                    <p className="leading-relaxed">{msg.body}</p>
                    <p className={`mt-1 text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border px-4 py-3 bg-card/50">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="rounded-full"
              />
              <Button type="submit" size="icon" className="rounded-full shrink-0 h-10 w-10" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24">
      <div className="fixed inset-0 z-0" style={{ backgroundImage: `url(${bgWrigleyPlayball})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="fixed inset-0 z-0" style={{ backgroundColor: 'hsla(222, 47%, 11%, 0.55)' }} />
      <div className="relative z-10">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-4">
        <h2 className="mb-4 text-lg font-bold">Messages</h2>

        {isLoading ? (
          <div className="py-20 text-center">
            <p className="text-4xl animate-pulse">💬</p>
            <p className="mt-2 font-semibold text-muted-foreground">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MessageCircle className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">The bases are empty!</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[260px] mx-auto">
              Be the first to start a conversation. Scout the area and toss a Hi-Five!
            </p>
            <Button variant="outline" className="mt-5 rounded-xl" onClick={() => navigate('/discover')}>
              Discover Fans
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {conversations.map((convo) => {
              const otherId = convo.participant_a === user?.id ? convo.participant_b : convo.participant_a;
              const profile = profileMap[otherId];
              return (
                <motion.button
                  key={convo.id}
                  onClick={() => setSelectedConvoId(convo.id)}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-muted/60 transition-colors"
                >
                  {profile?.profile_photo ? (
                    <img src={profile.profile_photo} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-border" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">⚾</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">{profile?.display_name ?? 'Fan'}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {convo.last_message_at
                          ? new Date(convo.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                          : ''}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{convo.last_message_preview || 'Start the conversation!'}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
