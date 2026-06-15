import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, MessageCircle, ArrowLeft, Smile, Users } from 'lucide-react';
import { ErrorState } from '@/components/ErrorState';
import { QuickBlockButton } from '@/components/QuickBlockButton';
import { EmptyState } from '@/components/ui/EmptyState';
import bgWrigleyRooftops from '@/assets/bg-wrigley-playball.webp'; // 1920x1440 (was 1400x788 bg-wrigley-rooftops)
import { PageBackground } from '@/components/PageBackground';
import { DesktopPanel } from '@/components/DesktopPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useCrews } from '@/hooks/useCrews';
import {
  useConversations,
  useConversationProfiles,
  useConversationMessages,
  useSendMessage,
  useUnreadByConversation,
  useMarkConversationRead,
} from '@/hooks/useMessages';
import { STHBadge } from '@/components/profile/STHBadge';

const EMOJI_QUICK = ['⚾', '🍺', '🎉', '🔥', '👏', '🙌', '😂', '❤️', '🧢', '🌟', '💙', '❤'];

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Messages() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: conversations = [], isLoading, isError, refetch } = useConversations();
  const { data: profileMap = {} } = useConversationProfiles(conversations);
  const { data: unreadMap = {} } = useUnreadByConversation();
  const { data: crews = [] } = useCrews();
  const markRead = useMarkConversationRead();
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const { data: messages = [] } = useConversationMessages(selectedConvoId);
  const { send: sendChat, retry: retryChat } = useSendMessage(selectedConvoId);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Auto-scroll only if user is already near the bottom (~150px).
  useEffect(() => {
    if (nearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = distance < 150;
  };

  // Mark conversation as read when opened
  useEffect(() => {
    if (selectedConvoId && (unreadMap[selectedConvoId] ?? 0) > 0) {
      markRead.mutate(selectedConvoId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConvoId]);

  const selectedConvo = conversations.find((c) => c.id === selectedConvoId);
  const otherUserId = selectedConvo
    ? selectedConvo.participant_a === user?.id
      ? selectedConvo.participant_b
      : selectedConvo.participant_a
    : null;
  const otherProfile = otherUserId ? profileMap[otherUserId] : null;

  const myCrews = useMemo(() => crews.filter((c) => c.is_member), [crews]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConvoId) return;
    const ok = sendChat(newMessage);
    if (ok) {
      setNewMessage('');
      // Always pin to bottom right after the user sends.
      nearBottomRef.current = true;
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  if (selectedConvoId && selectedConvo) {
    return (
      <PageBackground image={bgWrigleyRooftops}>
        <div className="flex min-h-screen flex-col pb-24">

          <AppHeader />
          <DesktopPanel className="flex flex-col flex-1 w-full">
          <div className="mx-auto w-full max-w-lg flex-1 flex flex-col lg:mx-0 lg:max-w-none">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card/80 backdrop-blur">
              <button
                onClick={() => setSelectedConvoId(null)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="relative h-9 w-9 shrink-0">
                {otherProfile?.profile_photo ? (
                  <img
                    src={otherProfile.profile_photo}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover ring-2"
                    style={{ borderColor: 'hsl(var(--brand-navy))' }} loading="lazy" decoding="async" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-muted" />
                )}
                {(otherProfile as any)?.is_season_ticket_holder && (
                  <STHBadge size="xs" className="absolute -bottom-0.5 -right-0.5 ring-2 ring-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {otherProfile?.display_name ?? 'Fan'}
                </p>
                <p className="text-[11px] text-muted-foreground">Direct chat · 2 members</p>
              </div>
              {otherUserId && (
                <QuickBlockButton
                  targetUserId={otherUserId}
                  targetName={otherProfile?.display_name}
                  onBlocked={() => setSelectedConvoId(null)}
                />
              )}
            </div>

            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 space-y-3 p-4 overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center py-16">
                  <p className="font-semibold text-foreground text-sm">The bases are empty!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Be the first to start a conversation.
                  </p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender === user?.id;
                const status = (msg as any)._status as 'sending' | 'sent' | 'failed' | undefined;
                const clientId = (msg as any)._clientId as string | undefined;
                const isFailed = status === 'failed';
                const isSending = status === 'sending';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm"
                      style={{
                        backgroundColor: isMe ? 'hsl(var(--brand-red))' : 'hsl(var(--brand-navy))',
                        color: '#FFFFFF',
                        borderBottomRightRadius: isMe ? 6 : undefined,
                        borderBottomLeftRadius: !isMe ? 6 : undefined,
                        opacity: isSending ? 0.7 : isFailed ? 0.85 : 1,
                      }}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                      <p className="mt-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {isSending
                          ? 'Sending…'
                          : new Date(msg.created_at).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                      </p>
                    </div>
                    {isMe && isFailed && clientId && (
                      <button
                        type="button"
                        onClick={() => retryChat(clientId)}
                        className="mt-1 text-[11px] font-semibold underline underline-offset-2"
                        style={{ color: 'hsl(var(--brand-red))' }}
                      >
                        Not delivered — tap to retry
                      </button>
                    )}
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border px-3 py-3 bg-card/80 backdrop-blur">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="rounded-full shrink-0 h-10 w-10"
                      aria-label="Emoji picker"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="start"
                    className="w-[260px] p-2"
                    sideOffset={8}
                  >
                    <div className="grid grid-cols-6 gap-1">
                      {EMOJI_QUICK.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setNewMessage((m) => m + e)}
                          className="text-2xl h-10 w-10 rounded-md hover:bg-muted transition-colors"
                          aria-label={`Insert ${e}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="rounded-full"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full shrink-0 h-10 w-10"
                  disabled={!newMessage.trim()}
                  style={{ backgroundColor: 'hsl(var(--brand-red))', color: '#FFFFFF' }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
          </DesktopPanel>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground image={bgWrigleyRooftops}>
      <div className="min-h-screen pb-24">
        <AppHeader />
        <DesktopPanel>
        <div className="mx-auto max-w-lg px-4 pt-4 lg:mx-0 lg:px-0 lg:pt-0 lg:max-w-none lg:w-full">
          <h2 className="mb-4 text-xl font-extrabold text-white">Messages</h2>


          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
                >
                  <div className="h-11 w-11 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-44 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-10 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : conversations.length === 0 && myCrews.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="No messages yet"
              description="Connect with a buddy or join a crew to start chatting."
              actionLabel="Discover Fans"
              onAction={() => navigate('/discover-fans')}
            />
          ) : (
            <div className="space-y-1">
              {conversations.map((convo) => {
                const otherId =
                  convo.participant_a === user?.id ? convo.participant_b : convo.participant_a;
                const profile = profileMap[otherId];
                const unread = unreadMap[convo.id] ?? 0;
                const hasUnread = unread > 0;
                return (
                  <motion.button
                    key={convo.id}
                    onClick={() => setSelectedConvoId(convo.id)}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-muted/60 transition-colors bg-card/60"
                  >
                    <div className="relative h-12 w-12 shrink-0">
                      {profile?.profile_photo ? (
                        <img
                          src={profile.profile_photo}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover ring-2"
                          style={{ borderColor: 'hsl(var(--brand-navy))' }} loading="lazy" decoding="async" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-muted" />
                      )}
                      {(profile as any)?.is_season_ticket_holder && (
                        <STHBadge size="xs" className="absolute -bottom-0.5 -right-0.5 ring-2 ring-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-sm text-foreground truncate"
                          style={{ fontWeight: hasUnread ? 800 : 500 }}
                        >
                          {profile?.display_name ?? 'Fan'}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {timeAgo(convo.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p
                          className="truncate text-sm flex-1"
                          style={{
                            color: hasUnread ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                            fontWeight: hasUnread ? 600 : 400,
                          }}
                        >
                          {convo.last_message_preview || 'Start the conversation!'}
                        </p>
                        {hasUnread && (
                          <span
                            aria-label={`${unread} unread`}
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: 'hsl(var(--brand-red))' }}
                          />
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}

              {myCrews.length > 0 && (
                <div className="pt-4">
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Crew chats
                  </p>
                  {myCrews.map((crew) => (
                    <motion.button
                      key={crew.id}
                      onClick={() => navigate(`/crews/${crew.id}`)}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-muted/60 transition-colors bg-card/60"
                    >
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'hsl(var(--brand-navy))', color: '#FFFFFF' }}
                      >
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {crew.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {crew.member_count} {crew.member_count === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          Open crew chat →
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </DesktopPanel>
      </div>
    </PageBackground>
  );
}
