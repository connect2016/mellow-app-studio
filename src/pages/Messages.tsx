import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
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
      <div className="flex min-h-screen flex-col bg-background pb-24">
        <AppHeader />
        <div className="mx-auto w-full max-w-lg flex-1 flex flex-col">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <button onClick={() => setSelectedConvoId(null)} className="text-sm text-muted-foreground hover:text-foreground">←</button>
            {otherProfile?.profile_photo && (
              <img src={otherProfile.profile_photo} alt="" className="h-8 w-8 rounded-full object-cover" />
            )}
            <span className="font-semibold text-sm">{otherProfile?.display_name ?? 'Fan'}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 p-4 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">No messages yet. Say hi! 👋</p>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p>{msg.body}</p>
                    <p className={`mt-1 text-xs ${isMe ? 'opacity-70' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border px-4 py-3">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="rounded-full"
              />
              <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-4">
        <h2 className="mb-4 text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>Messages</h2>

        {isLoading ? (
          <div className="py-20 text-center">
            <p className="text-4xl animate-pulse">💬</p>
            <p className="mt-2 font-semibold text-muted-foreground">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl">💬</p>
            <p className="mt-2 font-semibold">No conversations yet</p>
            <p className="text-sm text-muted-foreground">Match with someone to start chatting!</p>
          </div>
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
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-muted transition-colors"
                >
                  {profile?.profile_photo ? (
                    <img src={profile.profile_photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg">⚾</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{profile?.display_name ?? 'Fan'}</span>
                      <span className="text-xs text-muted-foreground">
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
  );
}
