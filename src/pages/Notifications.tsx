import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, useMarkRead, useMarkAllRead, useClearNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCheck, Trash2, Users, MapPin, Trophy, Utensils, Hand } from 'lucide-react';
import { cn } from '@/lib/utils';
import bgFansBleachers from '@/assets/bg-fans-bleachers.jpg';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
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

  return (
    <div className="relative min-h-screen pb-24">
      <div className="fixed inset-0 z-0" style={{ backgroundImage: `url(${bgFansBleachers})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="fixed inset-0 z-0" style={{ backgroundColor: 'hsla(222, 47%, 11%, 0.25)' }} />
      <div className="relative z-10">
      <AppHeader />

      <div className="mx-auto max-w-lg px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex gap-1.5">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 rounded-full text-xs"
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Read All
              </Button>
            )}
            {notifications.some(n => n.is_read) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 rounded-full text-xs"
                onClick={() => clearRead.mutate()}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Category filter chips */}
        <div
          className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {FILTERS.map(({ key, label, icon: Icon }) => {
            const active = filter === key;
            const count = counts[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 min-h-[36px] text-[12px] font-bold whitespace-nowrap transition-all duration-150 active:scale-95',
                  active
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card/80 text-foreground border border-border hover:bg-card',
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                {label}
                {count > 0 && (
                  <span
                    className={cn(
                      'ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold',
                      active
                        ? 'bg-primary-foreground text-primary'
                        : 'bg-primary text-primary-foreground',
                    )}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <p className="text-4xl animate-pulse"></p>
            <p className="mt-2 text-sm font-medium text-muted-foreground">Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">
              {filter === 'all' ? 'All caught up!' : 'Nothing here yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === 'all'
                ? "We'll notify you when something happens"
                : 'Try another category or check back later.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
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
                        className={`w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-all ${
                          notif.is_read
                            ? 'bg-card border border-border/50'
                            : 'bg-primary/[0.04] border border-primary/20 shadow-sm'
                        } hover:bg-muted/60 active:scale-[0.99]`}
                      >
                        {/* Emoji avatar */}
                        <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full text-lg ${
                          notif.is_read ? 'bg-muted' : 'bg-primary/10'
                        }`}>
                          <ConceptVisual name={notif.emoji} size="sm" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold truncate ${
                              notif.is_read ? 'text-foreground/80' : 'text-foreground'
                            }`}>
                              {notif.title}
                            </p>
                            {!notif.is_read && (
                              <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.body}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {timeAgo(notif.created_at)}
                          </p>
                        </div>

                        {!notif.is_read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markRead.mutate(notif.id); }}
                            className="flex-shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors"
                          >
                            <Check className="h-4 w-4 text-muted-foreground" />
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
