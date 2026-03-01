import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MOCK_USERS } from '@/types';
import { Send } from 'lucide-react';

interface MockConvo {
  userId: string;
  lastMessage: string;
  time: string;
  unread: boolean;
}

const MOCK_CONVOS: MockConvo[] = [
  { userId: '2', lastMessage: "Hey! Are you at the game today?", time: '2m ago', unread: true },
  { userId: '4', lastMessage: "Great game last night!", time: '1h ago', unread: false },
  { userId: '5', lastMessage: "Kerry Wood was unreal", time: '3h ago', unread: false },
];

const MOCK_MESSAGES = [
  { id: '1', sender: '2', body: "Hey! Saw you're at Wrigley too 🏟️", time: '5:32 PM' },
  { id: '2', sender: 'me', body: "Yeah! Section 202. Great day for a game!", time: '5:33 PM' },
  { id: '3', sender: '2', body: "Are you at the game today?", time: '5:35 PM' },
];

export default function Messages() {
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const selectedUser = selectedConvo ? MOCK_USERS.find((u) => u.id === selectedConvo) : null;

  if (selectedConvo && selectedUser) {
    return (
      <div className="flex min-h-screen flex-col bg-background pb-24">
        <AppHeader />
        <div className="mx-auto w-full max-w-lg flex-1">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <button onClick={() => setSelectedConvo(null)} className="text-sm text-muted-foreground hover:text-foreground">←</button>
            <img src={selectedUser.profile_photo} alt="" className="h-8 w-8 rounded-full object-cover" />
            <span className="font-semibold text-sm">{selectedUser.display_name}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 p-4">
            {MOCK_MESSAGES.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p>{msg.body}</p>
                  <p className={`mt-1 text-xs ${msg.sender === 'me' ? 'opacity-70' : 'text-muted-foreground'}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t px-4 py-3">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="rounded-full"
              />
              <Button size="icon" className="rounded-full shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
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

        {MOCK_CONVOS.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl">💬</p>
            <p className="mt-2 font-semibold">No conversations yet</p>
            <p className="text-sm text-muted-foreground">Match with someone to start chatting!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {MOCK_CONVOS.map((convo) => {
              const user = MOCK_USERS.find((u) => u.id === convo.userId);
              if (!user) return null;
              return (
                <motion.button
                  key={convo.userId}
                  onClick={() => setSelectedConvo(convo.userId)}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-muted transition-colors"
                >
                  <img src={user.profile_photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{user.display_name}</span>
                      <span className="text-xs text-muted-foreground">{convo.time}</span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{convo.lastMessage}</p>
                  </div>
                  {convo.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
