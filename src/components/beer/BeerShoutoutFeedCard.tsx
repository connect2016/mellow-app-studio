/**
 * Server-backed beer shoutout card (auto-generated when a tip is sent).
 * Renders: amber gradient, sender→recipient avatar layout, optional message,
 * and a recipient-only "Send one back" reciprocity CTA.
 *
 * Replaces the older localStorage-based BeerShoutoutCard for the live feed.
 */
import { useState } from 'react';
import { Beer, ArrowRight, PartyPopper } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { haptic } from '@/lib/haptics';
import { track } from '@/lib/analytics';
import { BuyBeerModal } from './BuyBeerModal';
import { BeerBuyerBadge } from './BeerBuyerBadge';
import type { BeerShoutoutWithProfiles } from '@/hooks/useBeerShoutouts';

interface Props {
  shoutout: BeerShoutoutWithProfiles;
  className?: string;
  highlighted?: boolean;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function BeerShoutoutFeedCard({ shoutout, className, highlighted }: Props) {
  const { user } = useAuth();
  const [reciprocateOpen, setReciprocateOpen] = useState(false);

  const isRecipient = !!user && user.id === shoutout.recipient_id;
  const isBuyer = !!user && user.id === shoutout.sender_id;
  const senderName = shoutout.sender?.display_name || 'A fan';
  const recipientName = shoutout.recipient?.display_name || 'a fan';
  const senderFirst = senderName.split(' ')[0];
  const dollars = (shoutout.credits / 100).toFixed(0);

  const handleReciprocate = () => {
    haptic('selection');
    track('beer_reciprocated', {
      original_tip_id: shoutout.tip_id,
      original_shoutout_id: shoutout.id,
    });
    setReciprocateOpen(true);
  };

  return (
    <>
      <article
        id={`shoutout-${shoutout.id}`}
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 p-3.5 space-y-3 transition-all',
          'border-amber-500/40 bg-gradient-to-br from-amber-50 to-yellow-100',
          'dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-500/30',
          highlighted && 'ring-4 ring-amber-400/60 shadow-lg',
          className,
        )}
        aria-label={`${senderName} bought ${recipientName} a beer`}
      >
        {/* Header ribbon */}
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500 text-white hover:bg-amber-500 gap-1 font-bold">
            <PartyPopper className="h-3 w-3" aria-hidden="true" />
            <span>🍺 {senderFirst} bought {recipientName} a beer</span>
          </Badge>
          <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
            {timeAgo(shoutout.created_at)}
          </span>
        </div>

        {/* Sender → Recipient with avatars + amount */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-center gap-1 min-w-0">
            <Avatar className="h-12 w-12 border-2 border-amber-500/40">
              {shoutout.sender?.profile_photo && (
                <AvatarImage src={shoutout.sender.profile_photo} alt="" />
              )}
              <AvatarFallback className="text-sm font-bold bg-amber-500/15">
                {senderName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-[11px] font-bold truncate max-w-[88px]">{senderFirst}</p>
            <BeerBuyerBadge userId={shoutout.sender_id} variant="chip" />
          </div>

          <div className="flex flex-col items-center gap-1 px-1">
            <ArrowRight className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5">
              <Beer className="h-3 w-3 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 tabular-nums">
                ${dollars}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 min-w-0">
            <Avatar className="h-12 w-12 border-2 border-amber-500/40">
              {shoutout.recipient?.profile_photo && (
                <AvatarImage src={shoutout.recipient.profile_photo} alt="" />
              )}
              <AvatarFallback className="text-sm font-bold bg-amber-500/15">
                {recipientName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-[11px] font-bold truncate max-w-[88px]">
              {recipientName.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* Optional message */}
        {shoutout.message && (
          <blockquote className="rounded-xl bg-background/70 border border-amber-500/20 px-3 py-2 text-sm italic text-foreground/90">
            &ldquo;{shoutout.message}&rdquo;
          </blockquote>
        )}

        {/* Recipient-only reciprocity CTA */}
        {isRecipient && (
          <Button
            type="button"
            onClick={handleReciprocate}
            variant="default"
            size="sm"
            className="w-full min-h-[48px] gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
            aria-label={`Send ${senderFirst} a beer back`}
          >
            <Beer className="h-4 w-4" aria-hidden="true" />
            Send one back
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}

        {isBuyer && (
          <p className="text-[11px] text-center text-muted-foreground italic">
            You bought this round 🍻
          </p>
        )}
      </article>

      {isRecipient && (
        <BuyBeerModal
          open={reciprocateOpen}
          onOpenChange={setReciprocateOpen}
          context={{
            kind: 'fan',
            userId: shoutout.sender_id,
            firstName: senderFirst,
            avatarUrl: shoutout.sender?.profile_photo ?? undefined,
          }}
        />
      )}
    </>
  );
}
