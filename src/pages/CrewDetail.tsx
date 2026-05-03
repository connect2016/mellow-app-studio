import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCrew, useCrewMembers, useCrewMessages, useCrewEvents,
  useSendCrewMessage, useCreateCrewEvent, useVoteCrewEvent, useLeaveCrew,
} from '@/hooks/useCrews';
import {
  Users, Send, CalendarPlus, MapPin, Clock, ChevronLeft,
  Crown, LogOut, Vote, Check, Plus, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { BarPlansTab } from '@/components/crews/BarPlansTab';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

type Tab = 'chat' | 'plans' | 'events' | 'members';

export default function CrewDetail() {
  const { id: crewId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const { data: crew } = useCrew(crewId);
  const { data: members = [] } = useCrewMembers(crewId);
  const { data: messages = [] } = useCrewMessages(crewId);
  const { data: events = [] } = useCrewEvents(crewId);
  const sendMessage = useSendCrewMessage();
  const createEvent = useCreateCrewEvent();
  const vote = useVoteCrewEvent();
  const leaveCrew = useLeaveCrew();

  const [tabParams, setTabParams] = useSearchParams();
  const VALID_TABS: readonly Tab[] = ['chat', 'plans', 'events', 'members'];
  const tabRaw = tabParams.get('tab');
  const tab: Tab = (VALID_TABS as readonly string[]).includes(tabRaw ?? '') ? (tabRaw as Tab) : 'chat';
  const setTab = (next: Tab) => {
    const p = new URLSearchParams(tabParams);
    if (next === 'chat') p.delete('tab'); else p.set('tab', next);
    setTabParams(p, { replace: false });
  };
  const [msgInput, setMsgInput] = useState('');
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventOptions, setEventOptions] = useState([{ label: '', date_time: '', location: '' }]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isMember = members.some(m => m.user_id === user?.id);
  const myRole = members.find(m => m.user_id === user?.id)?.role;

  const handleSend = async () => {
    if (!msgInput.trim() || !crewId) return;
    const body = msgInput.trim();
    setMsgInput('');
    try {
      await sendMessage.mutateAsync({ crewId, body });
    } catch {
      toast.error('Failed to send');
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !crewId) return;
    const validOptions = eventOptions.filter(o => o.label.trim());
    try {
      await createEvent.mutateAsync({
        crewId,
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        options: validOptions.map(o => ({
          label: o.label.trim(),
          date_time: o.date_time || undefined,
          location: o.location || undefined,
        })),
      });
      toast.success('Meetup poll created!');
      setShowNewEvent(false);
      setEventTitle('');
      setEventDesc('');
      setEventOptions([{ label: '', date_time: '', location: '' }]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create');
    }
  };

  const handleLeave = async () => {
    if (!crewId) return;
    try {
      await leaveCrew.mutateAsync(crewId);
      toast('Left the crew');
      navigate('/crews');
    } catch {
      toast.error('Failed to leave');
    }
  };

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'chat', label: 'Chat', count: messages.length },
    { key: 'plans', label: 'Plans' },
    { key: 'events', label: 'Meetups', count: events.length },
    { key: 'members', label: 'Members', count: members.length },
  ];

  if (!crew) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="py-20 text-center">
          <p className="text-3xl animate-pulse"></p>
          <p className="mt-2 text-sm text-muted-foreground">Loading crew...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      {/* Crew header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-lg px-4 py-4">
          <button onClick={() => navigate('/crews')} className="flex items-center gap-1 text-sm text-muted-foreground mb-2 hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Crews
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
              {crew.badge_emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">
                {crew.name}
              </h1>
              {crew.description && (
                <p className="text-xs text-muted-foreground truncate">{crew.description}</p>
              )}
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Users className="h-3 w-3" /> {members.length}/{crew.max_members} members
              </p>
            </div>
            {isMember && myRole !== 'captain' && (
              <Button variant="ghost" size="sm" onClick={handleLeave} className="text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-lg px-4 flex gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex-1 py-3 text-sm font-medium text-center transition-colors ${
                tab === t.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {(t.count ?? 0) > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">({t.count})</span>
              )}
              {tab === t.key && (
                <motion.div layoutId="crew-tab-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ─── Chat Tab ─── */}
          {tab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-[calc(100vh-260px)]">
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-lg px-4 py-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-2xl"></p>
                      <p className="mt-2 text-sm text-muted-foreground">The bases are empty! Be the first to start a conversation.</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                      >
                        <div className="h-7 w-7 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                          {msg.sender_profile?.profile_photo ? (
                            <img src={msg.sender_profile.profile_photo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              {msg.sender_profile?.display_name?.charAt(0) ?? '?'}
                            </div>
                          )}
                        </div>
                        <div className={`max-w-[75%] ${isMe ? 'text-right' : ''}`}>
                          <p className="text-[10px] text-muted-foreground mb-0.5">
                            {isMe ? 'You' : msg.sender_profile?.display_name}
                          </p>
                          <div className={`rounded-2xl px-3 py-2 text-sm ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted text-foreground rounded-tl-sm'
                          }`}>
                            {msg.body}
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {formatDistanceToNowStrict(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Message input */}
              {isMember && (
                <div className="border-t border-border bg-card px-4 py-3">
                  <div className="mx-auto max-w-lg flex gap-2">
                    <Input
                      placeholder="Message your crew..."
                      value={msgInput}
                      onChange={e => setMsgInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      className="rounded-full"
                    />
                    <Button size="icon" onClick={handleSend} disabled={!msgInput.trim()} className="rounded-full shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Plans Tab ─── */}
          {tab === 'plans' && crewId && (
            <BarPlansTab crewId={crewId} isMember={isMember} />
          )}

          {/* ─── Events/Meetups Tab ─── */}
          {tab === 'events' && (
            <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-y-auto h-[calc(100vh-260px)]">
              <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
                {isMember && (
                  <Button variant="outline" onClick={() => setShowNewEvent(!showNewEvent)} className="w-full rounded-xl gap-2">
                    <CalendarPlus className="h-4 w-4" />
                    Plan a Meetup
                  </Button>
                )}

                {/* New event form */}
                <AnimatePresence>
                  {showNewEvent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-primary/20 bg-card p-4 space-y-3">
                        <h3 className="font-semibold text-sm text-foreground">New Meetup Poll</h3>
                        <Input placeholder="What's the plan?" value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="rounded-xl" />
                        <Input placeholder="Any details (optional)" value={eventDesc} onChange={e => setEventDesc(e.target.value)} className="rounded-xl" />

                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Options to vote on</Label>
                          {eventOptions.map((opt, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                              <Input placeholder={`Option ${i + 1} (e.g. "Murphy's at 5pm")`} value={opt.label} onChange={e => {
                                const updated = [...eventOptions];
                                updated[i].label = e.target.value;
                                setEventOptions(updated);
                              }} className="rounded-xl flex-1" />
                              <Input type="datetime-local" value={opt.date_time} onChange={e => {
                                const updated = [...eventOptions];
                                updated[i].date_time = e.target.value;
                                setEventOptions(updated);
                              }} className="rounded-xl w-[180px]" />
                              {eventOptions.length > 1 && (
                                <Button variant="ghost" size="icon" onClick={() => setEventOptions(eventOptions.filter((_, j) => j !== i))} className="shrink-0">
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {eventOptions.length < 5 && (
                            <Button variant="ghost" size="sm" onClick={() => setEventOptions([...eventOptions, { label: '', date_time: '', location: '' }])} className="gap-1 text-xs">
                              <Plus className="h-3 w-3" /> Add option
                            </Button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={handleCreateEvent} disabled={!eventTitle.trim() || createEvent.isPending} className="flex-1 rounded-xl">
                            {createEvent.isPending ? 'Creating...' : ' Create Poll'}
                          </Button>
                          <Button variant="outline" onClick={() => setShowNewEvent(false)} className="rounded-xl">Cancel</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Event list */}
                {events.length === 0 && !showNewEvent && (
                  <div className="py-12 text-center">
                    <p className="text-2xl"></p>
                    <p className="mt-2 text-sm text-muted-foreground">No rallies planned yet — get one going!</p>
                  </div>
                )}

                {events.map(event => {
                  const totalVotes = event.options?.reduce((sum, o) => sum + (o.vote_count ?? 0), 0) ?? 0;
                  const maxVotes = Math.max(...(event.options?.map(o => o.vote_count ?? 0) ?? [0]));

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{event.title}</p>
                          {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          event.status === 'voting'
                            ? 'bg-secondary/20 text-secondary-foreground'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {event.status === 'voting' ? ' Voting' : ' Finalized'}
                        </span>
                      </div>

                      {/* Poll options */}
                      <div className="space-y-2">
                        {event.options?.map(opt => {
                          const pct = totalVotes > 0 ? Math.round(((opt.vote_count ?? 0) / totalVotes) * 100) : 0;
                          const isWinning = (opt.vote_count ?? 0) === maxVotes && maxVotes > 0;

                          return (
                            <button
                              key={opt.id}
                              onClick={() => crewId && vote.mutate({ optionId: opt.id, crewId })}
                              disabled={event.status !== 'voting'}
                              className={`w-full relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                                opt.user_voted
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border bg-background hover:border-primary/30'
                              }`}
                            >
                              {/* Progress bar */}
                              <div
                                className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                                  isWinning ? 'bg-primary/10' : 'bg-muted/50'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                              <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {opt.user_voted && <Check className="h-3.5 w-3.5 text-primary" />}
                                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {opt.date_time && (
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="h-3 w-3" />
                                      {format(new Date(opt.date_time), 'MMM d, h:mm a')}
                                    </span>
                                  )}
                                  <span className="font-semibold">{opt.vote_count ?? 0}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-[10px] text-muted-foreground text-center">
                        {totalVotes} vote{totalVotes !== 1 ? 's' : ''} • Tap to vote
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─── Members Tab ─── */}
          {tab === 'members' && (
            <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-y-auto h-[calc(100vh-260px)]">
              <div className="mx-auto max-w-lg px-4 py-4 space-y-2">
                {members.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted border border-border">
                      {m.profile?.profile_photo ? (
                        <img src={m.profile.profile_photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {m.profile?.display_name?.charAt(0) ?? '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {m.profile?.display_name}
                        {m.user_id === user?.id && <span className="text-muted-foreground font-normal"> (you)</span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Joined {formatDistanceToNowStrict(new Date(m.joined_at), { addSuffix: true })}
                      </p>
                    </div>
                    {m.role === 'captain' && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                        <Crown className="h-3 w-3" /> Captain
                      </span>
                    )}
                  </motion.div>
                ))}

                {/* Invite code */}
                {isMember && crew.invite_code && (
                  <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Share invite code</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(crew.invite_code);
                        toast.success('Invite code copied!');
                      }}
                      className="text-lg font-mono font-bold text-primary tracking-widest hover:opacity-80 transition-opacity"
                    >
                      {crew.invite_code}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
