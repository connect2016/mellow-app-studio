import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, useMarkRead, useMarkAllRead, useClearNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCheck, Trash2, Users, SlidersHorizontal, Sparkles, CalendarDays, Beer, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import bgFansBleachers from '@/assets/bg-fans-bleachers.webp';
import { ConceptVisual } from '@/components/icons/ConceptThumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { BuyBeerModal } from '@/components/beer/BuyBeerModal';
import { track as analyticsTrack } from '@/lib/analytics';

type FilterKey = 'all' | 'buddies' | 'beers' | 'meetups' | 'vibes';

const FILTERS: { key: FilterKey; label: string; icon: typeof Bell }[] = [
  { key: 'all',     label: 'All',     icon: Bell },
  { key: 'buddies', label: 'Buddies', icon: Users },
  { key: 'beers',   label: 'Beers',   icon: Beer },
  { key: 'meetups', label: 'Meetups', icon: CalendarDays },
  { key: 'vibes',   label: 'Vibes',   icon: Sparkles },
];

function categorize(type: string): FilterKey {
  if (
    type === 'buddy_request' || type === 'buddy_accepted' ||
    type === 'teammate_request' || type === 'teammate_accepted' ||
    type === 'match' || type.startsWith('match_')
  ) return 'buddies';
  if (type === 'beer_received') return 'beers';
  if (type.startsWith('meetup')) return 'meetups';
  if (type === 'vibe_mention' || type === 'vibe_reaction') return 'vibes';
  return 'all';
}

/** Type → action_url fallback for legacy rows that have a null action_url. */
function fallbackActionUrl(type: string, metadata: Record<string, unknown> | null | undefined): string | null {
  const meta = (metadata ?? {}) as Record<string, unknown>;
  const meetupId = typeof meta.meetup_id === 'string' ? meta.meetup_id : null;
  const postId   = typeof meta.post_id === 'string' ? meta.post_id : null;
  switch (type) {
    case 'buddy_request':
    case 'teammate_request':
      return '/discover-fans';
    case 'buddy_accepted':
    case 'teammate_accepted':
    case 'message':
    case 'match':
      return '/messages';
    case 'meetup':
    case 'meetup_created':
    case 'meetup_joined':
      return meetupId ? `/meetups/${meetupId}` : '/meetups';
    case 'meetup_nearby':
      return '/meetups';
    case 'beer_received':
      return '/beer-money';
    case 'vibe_mention':
    case 'vibe_reaction':
      return postId ? `/vibe?highlight=${postId}` : '/vibe';
    default:
      return null;
  }
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
  const [reciprocate, setReciprocate] = useState<{ senderId: string; senderName?: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const filtered = useMemo(
    () => (filter === 'all' ? notifications : notifications.filter((n) => categorize(n.type) === filter)),
    [notifications, filter],
  );

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: 0, buddies: 0, beers: 0, meetups: 0, vibes: 0 };
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
    const target = notif.action_url || fallbackActionUrl(notif.type, notif.metadata as Record<string, unknown> | null);
    if (target) navigate(target);
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
                onClick={() => { track('filter_open'); navigate('/settings/notifications'); }}
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
              className="rounded-2xl border border-white/10 overflow-hidden"
              style={{
                backgroundColor: 'hsla(222, 47%, 8%, 0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              {filter === 'all' ? (
                <EmptyState
                  icon={Bell}
                  title="You're all caught up"
                  description="We'll notify you when buddies connect, send beers, or create meetups."
                  actionLabel="Drop a Vibe"
                  onAction={() => { track('empty_cta', { cta: 'drop_vibe' }); navigate('/vibe'); }}
                  secondaryLabel="Browse Meetups"
                  onSecondary={() => { track('empty_cta', { cta: 'browse_meetups' }); navigate('/meetups'); }}
                  className="text-white [&_p]:!text-white/85 [&_p.text-foreground]:!text-white"
                />
              ) : (
                <EmptyState
                  icon={Sparkles}
                  title="Nothing here yet"
                  description="Try another category or check back later."
                  className="text-white [&_p]:!text-white/85 [&_p.text-foreground]:!text-white"
                />
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
                              : 'bg-white/95 border-primary/40 shadow-sm hover:bg-white',
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
                                  notif.is_read ? 'text-white' : 'text-[hsl(var(--brand-navy))]',
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
                                notif.is_read ? 'text-white/85' : 'text-[hsl(var(--brand-navy))]/85',
                              )}
                            >
                              {notif.body}
                            </p>
                            <p
                              className={cn(
                                'text-[11px] mt-1 font-medium',
                                notif.is_read ? 'text-white/65' : 'text-[hsl(var(--brand-navy))]/65',
                              )}
                            >
                              {timeAgo(notif.created_at)}
                            </p>

                            {notif.type === 'beer_received' && (notif.metadata as any)?.sender_id && (
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const meta = notif.metadata as any;
                                  analyticsTrack('beer_reciprocated', {
                                    original_tip_id: meta?.tip_id,
                                    original_shoutout_id: meta?.shoutout_id,
                                    source: 'notification',
                                  });
                                  setReciprocate({
                                    senderId: meta.sender_id,
                                    senderName: notif.title?.replace(/ bought you a beer!?$/, '').trim(),
                                  });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const meta = notif.metadata as any;
                                    analyticsTrack('beer_reciprocated', {
                                      original_tip_id: meta?.tip_id,
                                      original_shoutout_id: meta?.shoutout_id,
                                      source: 'notification',
                                    });
                                    setReciprocate({
                                      senderId: meta.sender_id,
                                      senderName: notif.title?.replace(/ bought you a beer!?$/, '').trim(),
                                    });
                                  }
                                }}
                                aria-label="Send one back"
                                className={cn(
                                  'mt-2 inline-flex items-center gap-1.5 rounded-full px-3 min-h-[36px] text-xs font-bold cursor-pointer transition-colors',
                                  'bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]',
                                )}
                              >
                                <Beer className="h-3.5 w-3.5" aria-hidden="true" />
                                Send one back
                                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                              </div>
                            )}
                          </div>

                          {!notif.is_read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markRead.mutate(notif.id); }}
                              aria-label="Mark as read"
                              className="flex-shrink-0 inline-flex items-center justify-center h-11 w-11 min-h-[44px] min-w-[44px] rounded-full hover:bg-[hsl(var(--brand-navy))]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <Check className="h-4 w-4 text-[hsl(var(--brand-navy))]" />
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

      {reciprocate && (
        <BuyBeerModal
          open={!!reciprocate}
          onOpenChange={(o) => { if (!o) setReciprocate(null); }}
          context={{
            kind: 'fan',
            userId: reciprocate.senderId,
            firstName: reciprocate.senderName?.split(' ')[0] || 'Fan',
          }}
        />
      )}
    </div>
  );
}
