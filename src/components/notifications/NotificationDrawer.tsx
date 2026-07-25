import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ConceptVisual } from '@/components/icons/ConceptThumb';
import { Bell, X } from 'lucide-react';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/useNotifications';

/** Type → action_url fallback for legacy rows that have a null action_url.
 *  Mirrors the mapping in Notifications.tsx so the drawer routes the same way. */
function fallbackActionUrl(type: string, metadata: Record<string, unknown> | null | undefined): string | null {
  const meta = (metadata ?? {}) as Record<string, unknown>;
  const meetupId = typeof meta.meetup_id === 'string' ? meta.meetup_id : null;
  const postId = typeof meta.post_id === 'string' ? meta.post_id : null;
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

function timeAgo(date: string): string {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDrawer({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const allRead = notifications.length === 0 || notifications.every(n => n.is_read);

  const handleTap = (notif: typeof notifications[0]) => {
    if (!notif.is_read) markRead.mutate(notif.id);
    const target = notif.action_url || fallbackActionUrl(notif.type, notif.metadata);
    onOpenChange(false);
    if (target) navigate(target);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="mx-auto max-w-lg p-0 border-0 bg-[hsl(222,82%,18%)] rounded-b-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <SheetTitle className="sr-only">Notifications</SheetTitle>
        <SheetDescription className="sr-only">Recent activity from Wrigleyville Buddies</SheetDescription>

        {/* Red header bar */}
        <div className="bg-[hsl(var(--brand-red))] px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-white">
            <Bell className="h-5 w-5" strokeWidth={2.5} />
            <span
              className="text-lg font-bold uppercase"
              style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.04em' }}
            >
              Notifications
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => markAllRead.mutate()}
              disabled={allRead}
              className="text-[11px] font-bold uppercase tracking-wider text-white px-2.5 py-1.5 rounded-md bg-white/15 hover:bg-white/25 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition"
              style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.05em' }}
            >
              Mark all read
            </button>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close notifications"
              className="h-8 w-8 flex items-center justify-center rounded-full text-white hover:bg-white/15 active:scale-95 transition"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-3 space-y-2">
          {allRead ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="h-16 w-16 rounded-full bg-[hsl(var(--brand-red))]/20 ring-2 ring-[hsl(var(--brand-red))]/40 flex items-center justify-center mb-3">
                <ConceptVisual name="baseball" size="md" />
              </div>
              <p
                className="text-white font-bold text-lg"
                style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.03em' }}
              >
                You're all caught up!
              </p>
              <p className="text-white/60 text-sm mt-1">Check back later for fresh updates.</p>
            </div>
          ) : (
            notifications.map(notif => {
              const isRead = notif.is_read;
              return (
                <button
                  key={notif.id}
                  onClick={() => handleTap(notif)}
                  className={`w-full text-left rounded-xl p-3 flex items-start gap-3 transition active:scale-[0.99] ${
                    isRead
                      ? 'bg-white/5 opacity-60'
                      : 'bg-white/10 hover:bg-white/15 ring-1 ring-white/10'
                  }`}
                >
                  <div className="shrink-0 h-10 w-10 rounded-lg bg-[hsl(var(--brand-red))]/25 ring-1 ring-[hsl(var(--brand-red))]/50 flex items-center justify-center">
                    <ConceptVisual name={notif.emoji} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-white text-sm font-bold leading-snug"
                      style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.02em' }}
                    >
                      {notif.title}
                    </p>
                    {notif.body && (
                      <p className="text-white/75 text-xs mt-0.5 line-clamp-2 leading-relaxed">{notif.body}</p>
                    )}
                    <p className="text-white/60 text-xs mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                  {!isRead && (
                    <span className="mt-1 shrink-0 h-2.5 w-2.5 rounded-full bg-[hsl(var(--brand-red))] ring-2 ring-[hsl(var(--brand-red))]/40 animate-pulse" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
