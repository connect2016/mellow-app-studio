import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, useMarkRead, useMarkAllRead, useClearNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';

export default function Notifications() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const clearRead = useClearNotifications();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
    { label: 'Today', items: notifications.filter(n => new Date(n.created_at) >= today) },
    { label: 'Yesterday', items: notifications.filter(n => { const d = new Date(n.created_at); return d >= yesterday && d < today; }) },
    { label: 'Earlier', items: notifications.filter(n => new Date(n.created_at) < yesterday) },
  ].filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-background pb-24">
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

        {isLoading ? (
          <div className="py-16 text-center">
            <p className="text-4xl animate-pulse">🔔</p>
            <p className="mt-2 text-sm font-medium text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">We'll notify you when something happens</p>
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
                          {notif.emoji}
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
  );
}
