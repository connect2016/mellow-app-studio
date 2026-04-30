import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, useMarkRead, useMarkAllRead, useClearNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCheck, Trash2, Users, MapPin, Trophy, Utensils, Hand, SlidersHorizontal, Sparkles, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import bgFansBleachers from '@/assets/bg-fans-bleachers.jpg';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

type FilterKey = 'all' | 'meetups' | 'fans' | 'gameday' | 'food' | 'hifives';

const FILTERS: { key: FilterKey; label: string; icon: typeof Bell }[] = [
  { key: 'all', label: 'All', icon: Bell },
  { key: 'meetups', label: 'Meetups', icon: Users },
  { key: 'fans', label: 'Fans Nearby', icon: MapPin },
  { key: 'gameday', label: 'Game Day', icon: Trophy },
  { key: 'food', label: 'Food', icon: Utensils },
  { key: 'hifives', label: 'Hi-Fives', icon: Hand },
];

function categorize(type: string): FilterKey {
  if (type.startsWith('meetup')) return 'meetups';
  if (type.startsWith('game') || type === 'weather') return 'gameday';
  if (type === 'hi_five' || type.includes('streak')) return 'hifives';
  if (type === 'food' || type.includes('food') || type === 'eats') return 'food';
  if (
    type === 'match' ||
    type === 'message' ||
    type === 'friend_checkin' ||
    type === 'friend_meetup' ||
    type === 'fans_nearby' ||
    type === 'teammate_request' ||
    type === 'teammate_accepted'
  )
    return 'fans';
  return 'all';
}

function track(event: string, payload?: Record<string, unknown>) {
  try {
    window.dispatchEvent(new CustomEvent(`cb:notif_${event}`, { detail: payload }));
  } catch {
    /* noop */
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const clearRead = useClearNotifications();
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const filtered = useMemo(
    () => (filter === 'all' ? notifications : notifications.filter((n) => categorize(n.type) === filter)),
    [notifications, filter],
  );

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: 0, meetups: 0, fans: 0, gameday: 0, food: 0, hifives: 0 };
    notifications.forEach((n) => {
      if (n.is_read) return;
      c.all += 1;
      const k = categorize(n.type);
      if (k !== 'all') c[k] += 1;
    });
    return c;
  }, [notifications]);

  const unreadCount = counts.all;

  const handleTap = (notif: typeof notifications[0]) => {
    if (!notif.is_read) markRead.mutate(notif.id);
    if (notif.action_url) navigate(notif.action_url);
  };

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Group notifications by time period
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = [
    { label: 'Today', items: filtered.filter(n => new Date(n.created_at) >= today) },
    { label: 'Yesterday', items: filtered.filter(n => { const d = new Date(n.created_at); return d >= yesterday && d < today; }) },
    { label: 'Earlier', items: filtered.filter(n => new Date(n.created_at) < yesterday) },
  ].filter(g => g.items.length > 0);

  const handleFilter = (key: FilterKey) => {
    setFilter(key);
    track('filter_tap', { key });
  };

  return (
    <div className="relative min-h-screen pb-24">
      {/* High-res background with progressive enhancement */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${bgFansBleachers})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />
      {/* Reduced tint with top-down gradient (25% avg) */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, hsla(222, 47%, 8%, 0.55) 0%, hsla(222, 47%, 10%, 0.30) 35%, hsla(222, 47%, 10%, 0.25) 70%, hsla(222, 47%, 8%, 0.55) 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <AppHeader />

        <div className="mx-auto max-w-lg px-4 pt-4">
          {/* Header card with backdrop blur for legibility */}
          <div
            className="rounded-2xl p-4 mb-4 border border-white/10 shadow-lg"
            style={{
              backgroundColor: 'hsla(222, 47%, 8%, 0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1
                  className="text-2xl font-bold text-white leading-tight"
                  style={{ textShadow: '0 1px 2px hsla(222, 47%, 4%, 0.5)' }}
                >
                  Notifications
                </h1>
                <p className="text-[13px] text-white/85 mt-1 leading-snug">
                  Manage what you hear about — meetups, fans nearby, game day alerts, and food specials.
                </p>
                {unreadCount > 0 && (
                  <p className="text-xs font-semibold text-primary-foreground bg-primary inline-block px-2 py-0.5 rounded-full mt-2">
                    {unreadCount} unread
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { track('filter_open'); navigate('/settings'); }}
                aria-label="Open notification preferences"
                className="flex-shrink-0 inline-flex items-center justify-center h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <SlidersHorizontal className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>

            {(unreadCount > 0 || notifications.some(n => n.is_read)) && (
              <div className="flex gap-2 mt-3">
                {unreadCount > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5 rounded-full text-xs min-h-[44px] flex-1"
                    onClick={() => markAllRead.mutate()}
                  >
                    <CheckCheck className="h-4 w-4" />
                    Read All
                  </Button>
                )}
                {notifications.some(n => n.is_read) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full text-xs min-h-[44px] flex-1 bg-white/5 text-white border-white/30 hover:bg-white/15"
                    onClick={() => clearRead.mutate()}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Read
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Sticky category filter */}
          <div
            className="sticky top-2 z-20 -mx-4 px-4 py-2 mb-4"
            style={{
              backgroundColor: 'hsla(222, 47%, 8%, 0.75)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderTop: '1px solid hsla(0, 0%, 100%, 0.06)',
              borderBottom: '1px solid hsla(0, 0%, 100%, 0.06)',
            }}
            role="tablist"
            aria-label="Notification categories"
          >
            <div className="relative">
              {/* Scroll fade indicators */}
              <div
                className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10"
                style={{ background: 'linear-gradient(90deg, hsla(222,47%,8%,0.85), transparent)' }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10"
                style={{ background: 'linear-gradient(270deg, hsla(222,47%,8%,0.85), transparent)' }}
                aria-hidden="true"
              />
              <div
                className="flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-px-4 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none' }}
              >
                {FILTERS.map(({ key, label, icon: Icon }) => {
                  const active = filter === key;
                  const count = counts[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={`${label}${count > 0 ? `, ${count} unread` : ''}`}
                      onClick={() => handleFilter(key)}
                      className={cn(
                        'snap-start shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 min-h-[44px] text-[13px] font-bold whitespace-nowrap transition-all duration-[120ms] ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        active
                          ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]'
                          : 'bg-white/10 text-white border border-white/20 hover:bg-white/20',
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.5} />
                      {label}
                      {count > 0 && (
                        <span
                          className={cn(
                            'ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-extrabold',
                            active
                              ? 'bg-primary-foreground text-primary'
                              : 'bg-primary text-primary-foreground animate-pulse',
                          )}
                        >
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-white/10 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center border border-white/10"
              style={{
                backgroundColor: 'hsla(222, 47%, 8%, 0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
                <Sparkles className="h-8 w-8 text-primary" strokeWidth={2.25} />
              </div>
              <h2
                className="text-xl font-bold text-white"
                style={{ textShadow: '0 1px 2px hsla(222, 47%, 4%, 0.5)' }}
              >
                {filter === 'all' ? 'All caught up!' : 'Nothing here yet'}
              </h2>
              <p className="text-sm text-white/85 mt-2 max-w-xs mx-auto leading-relaxed">
                {filter === 'all'
                  ? "We'll notify you when something happens. Want to get the party started? Drop a vibe or join a flash meetup."
                  : 'Try another category or check back later.'}
              </p>
              {filter === 'all' && (
                <div className="flex flex-col sm:flex-row gap-2 mt-5 justify-center">
                  <Button
                    variant="default"
                    size="default"
                    className="gap-2 rounded-full"
                    onClick={() => { track('empty_cta', { cta: 'drop_vibe' }); navigate('/vibe'); }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Drop a Vibe
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    className="gap-2 rounded-full bg-white/5 text-white border-white/30 hover:bg-white/15"
                    onClick={() => { track('empty_cta', { cta: 'browse_meetups' }); navigate('/meetups'); }}
                  >
                    <Calendar className="h-4 w-4" />
                    Browse Meetups
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map(group => (
                <div key={group.label}>
                  <p
                    className="text-[11px] font-bold text-white/80 uppercase tracking-wider mb-2 px-1"
                    style={{ textShadow: '0 1px 2px hsla(222, 47%, 4%, 0.5)' }}
                  >
                    {group.label}
                  </p>
                  <div className="space-y-1.5">
                    <AnimatePresence>
                      {group.items.map((notif, idx) => (
                        <motion.button
                          key={notif.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => handleTap(notif)}
                          aria-label={`${notif.title}. ${notif.body}. ${notif.is_read ? 'Read' : 'Unread'}.`}
                          className={cn(
                            'w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-all duration-150 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.99]',
                            notif.is_read
                              ? 'bg-white/[0.06] border-white/10 hover:bg-white/10'
                              : 'bg-white/95 border-primary/40 shadow-md hover:bg-white',
                          )}
                          style={
                            !notif.is_read
                              ? { backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }
                              : { backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }
                          }
                        >
                          <div
                            className={cn(
                              'flex-shrink-0 flex items-center justify-center h-11 w-11 rounded-full',
                              notif.is_read ? 'bg-white/10' : 'bg-primary/15',
                            )}
                          >
                            <ConceptVisual name={notif.emoji} size="sm" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  'text-[15px] font-semibold truncate',
                                  notif.is_read ? 'text-white' : 'text-[#0A2A66]',
                                )}
                                style={notif.is_read ? { textShadow: '0 1px 2px hsla(222, 47%, 4%, 0.5)' } : undefined}
                              >
                                {notif.title}
                              </p>
                              {!notif.is_read && (
                                <span className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" aria-label="Unread" />
                              )}
                            </div>
                            <p
                              className={cn(
                                'text-[13px] mt-0.5 line-clamp-2 leading-relaxed',
                                notif.is_read ? 'text-white/85' : 'text-[#0A2A66]/85',
                              )}
                            >
                              {notif.body}
                            </p>
                            <p
                              className={cn(
                                'text-[11px] mt-1 font-medium',
                                notif.is_read ? 'text-white/65' : 'text-[#0A2A66]/65',
                              )}
                            >
                              {timeAgo(notif.created_at)}
                            </p>
                          </div>

                          {!notif.is_read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markRead.mutate(notif.id); }}
                              aria-label="Mark as read"
                              className="flex-shrink-0 inline-flex items-center justify-center h-11 w-11 min-h-[44px] min-w-[44px] rounded-full hover:bg-[#0A2A66]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <Check className="h-4 w-4 text-[#0A2A66]" />
                            </button>
                          )}
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
