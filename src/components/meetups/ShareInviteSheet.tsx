import { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Check, Copy, Share2, Send } from 'lucide-react';
import { useInvitableConnections, useSendMeetupInvites } from '@/hooks/useMeetups';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { track } from '@/lib/analytics';

interface ShareInviteSheetProps {
  open: boolean;
  onClose: () => void;
  meetupId: string;
  meetupTitle: string;
}

export function ShareInviteSheet({ open, onClose, meetupId, meetupTitle }: ShareInviteSheetProps) {
  const { data: connections = [], isLoading } = useInvitableConnections();
  const sendInvites = useSendMeetupInvites();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/meetups/${meetupId}`;
  }, [meetupId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return connections;
    return connections.filter(c => c.display_name.toLowerCase().includes(q));
  }, [connections, search]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNativeShare = async () => {
    const text = `Join me at "${meetupTitle}" on Cubbies Buddies `;
    if (navigator.share) {
      try {
        await navigator.share({ title: meetupTitle, text, url: shareUrl });
      } catch {
        // user cancelled, no-op
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      track('invite_link_copied', { source: 'meetup_share_sheet' });
      toast.success('Link copied!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleSend = async () => {
    if (selected.size === 0) {
      toast.error('Pick at least one fan to invite');
      return;
    }
    try {
      await sendInvites.mutateAsync({
        meetupId,
        meetupTitle,
        userIds: Array.from(selected),
      });
      toast.success(` Sent ${selected.size} invite${selected.size === 1 ? '' : 's'}!`);
      setSelected(new Set());
      onClose();
    } catch {
      toast.error('Could not send invites');
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] flex flex-col p-0">
        <SheetHeader className="px-6 pt-5 pb-3">
          <SheetTitle className="text-lg font-bold">Share this meetup</SheetTitle>
        </SheetHeader>

        {/* Quick share row */}
        <div className="px-6 pb-3 flex gap-2">
          <Button
            onClick={handleNativeShare}
            variant="outline"
            className="flex-1 rounded-full gap-2 h-11"
          >
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1 rounded-full gap-2 h-11"
          >
            <Copy className="h-4 w-4" /> Copy link
          </Button>
        </div>

        <div className="border-t border-border" />

        {/* Invite friends */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-sm font-bold text-foreground">Or invite specific fans</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Matches and crew members get a tap-to-RSVP notification.
          </p>
        </div>

        <div className="px-6 pb-3">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your connections..."
            className="w-full h-10 rounded-full bg-muted px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-[120px]">
          {isLoading ? (
            <p className="text-center text-xs text-muted-foreground py-8">Loading your connections...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8 px-6">
              {connections.length === 0
                ? 'No connections yet — match with fans on the Home tab to invite them here.'
                : 'No matches for your search.'}
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map(c => {
                const isSelected = selected.has(c.user_id);
                return (
                  <li key={c.user_id}>
                    <button
                      onClick={() => toggle(c.user_id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition text-left min-h-[52px]"
                    >
                      <img
                        src={c.profile_photo || '/placeholder.svg'}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{c.display_name}</p>
                        {c.fan_title && (
                          <p className="text-[11px] text-muted-foreground truncate">{c.fan_title}</p>
                        )}
                      </div>
                      <div
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        }`}
                        aria-hidden
                      >
                        {isSelected && <Check className="h-4 w-4" />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-6 py-3">
          <Button
            onClick={handleSend}
            disabled={sendInvites.isPending || selected.size === 0}
            className="w-full rounded-full h-11 font-bold gap-2"
          >
            <Send className="h-4 w-4" />
            {sendInvites.isPending
              ? 'Sending...'
              : selected.size === 0
              ? 'Pick fans to invite'
              : `Send ${selected.size} invite${selected.size === 1 ? '' : 's'}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
