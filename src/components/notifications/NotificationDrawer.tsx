import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { Bell, X } from 'lucide-react';


interface SampleNotification {
  id: string;
  iconName: string;
  title: string;
  timeAgo: string;
}

const SAMPLE: SampleNotification[] = [
  { id: 'n1', iconName: 'baseball', title: 'Cubs vs Braves tomorrow — Game Day Mode activates at 11am', timeAgo: '2h ago' },
  { id: 'n2', iconName: 'people', title: 'A crew of 3 is forming at Murphy\'s Bleachers tonight', timeAgo: '4h ago' },
  { id: 'n3', iconName: 'beer', title: 'Drink specials are live at Cubby Bear', timeAgo: '5h ago' },
  { id: 'n4', iconName: 'pin', title: '2 fans near you just checked in at Bernie\'s Bleachers', timeAgo: '6h ago' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnreadChange?: (count: number) => void;
}

export function NotificationDrawer({ open, onOpenChange, onUnreadChange }: Props) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const markAllRead = () => {
    const all = new Set(SAMPLE.map(n => n.id));
    setReadIds(all);
    onUnreadChange?.(0);
  };

  const markRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      onUnreadChange?.(SAMPLE.length - next.size);
      return next;
    });
  };

  const allRead = readIds.size >= SAMPLE.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="mx-auto max-w-lg p-0 border-0 bg-[hsl(222,82%,18%)] rounded-b-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <SheetTitle className="sr-only">Notifications</SheetTitle>
        <SheetDescription className="sr-only">Recent activity from Wrigleyville Buddies</SheetDescription>

        {/* Red header bar */}
        <div className="bg-[hsl(var(--brand-red))] px-4 py-3 flex items-center justify-between gap-3 shadow-md">
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
              onClick={markAllRead}
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
                <ConceptIcon name="baseball" className="h-8 w-8 text-white" />
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
            SAMPLE.map(n => {
              const isRead = readIds.has(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left rounded-xl p-3 flex items-start gap-3 transition active:scale-[0.99] ${
                    isRead
                      ? 'bg-white/5 opacity-60'
                      : 'bg-white/10 hover:bg-white/15 ring-1 ring-white/10'
                  }`}
                >
                  <div className="shrink-0 h-10 w-10 rounded-lg bg-[hsl(var(--brand-red))]/25 ring-1 ring-[hsl(var(--brand-red))]/50 flex items-center justify-center">
                    <ConceptIcon name={n.iconName} className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-white text-sm font-bold leading-snug"
                      style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.02em' }}
                    >
                      {n.title}
                    </p>
                    <p className="text-white/60 text-xs mt-1">{n.timeAgo}</p>
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
