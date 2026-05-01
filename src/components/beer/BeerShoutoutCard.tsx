/**
 * Celebratory feed card shown in Live Vibe Feed when a public Buy a Beer
 * shoutout is posted. Includes sender, recipient, message, react & share.
 */
import { Beer, Heart, Share2, PartyPopper } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { reactToShoutout, shareShoutout, trackBeerEvent, type BeerShoutout } from '@/lib/gift-social';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface Props {
  shoutout: BeerShoutout;
  className?: string;
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

export function BeerShoutoutCard({ shoutout, className }: Props) {
  const { toast } = useToast();
  const [likes, setLikes] = useState(shoutout.reactions.likes);
  const [cheers, setCheers] = useState(shoutout.reactions.cheers);

  const handleReact = (kind: 'likes' | 'cheers') => {
    haptic('selection');
    reactToShoutout(shoutout.id, kind);
    if (kind === 'likes') setLikes((n) => n + 1);
    else setCheers((n) => n + 1);
    trackBeerEvent('beer_shoutout_reacted', { kind, shoutoutId: shoutout.id });
  };

  const handleShare = async () => {
    haptic('light');
    const result = await shareShoutout({
      senderName: shoutout.senderName,
      recipientLabel: shoutout.recipientLabel,
      amount: shoutout.amount,
      message: shoutout.message,
    });
    if (result === 'copied') toast({ title: 'Link copied to clipboard' });
    else if (result === 'failed') toast({ title: "Couldn't share", description: 'Try again or copy the link manually.' });
  };

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50/80 via-card to-card dark:from-amber-950/20 p-3.5 space-y-3',
        className,
      )}
      aria-label={`${shoutout.senderName} bought a round for ${shoutout.recipientLabel}`}
    >
      {/* Celebration ribbon */}
      <div className="flex items-center gap-2">
        <Badge className="bg-amber-500 text-white hover:bg-amber-500 gap-1">
          <PartyPopper className="h-3 w-3" />
          Round Bought
        </Badge>
        <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(shoutout.createdAt)}</span>
      </div>

      {/* Sender → Recipient */}
      <div className="flex items-center gap-2">
        <Avatar className="h-9 w-9 border border-border">
          {shoutout.senderAvatar && <AvatarImage src={shoutout.senderAvatar} alt="" />}
          <AvatarFallback className="text-xs">{shoutout.senderName.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <p className="text-sm leading-snug flex-1">
          <span className="font-bold">{shoutout.senderName}</span>{' '}
          <span className="text-muted-foreground">bought</span>{' '}
          <span className="font-bold">{shoutout.recipientLabel}</span>{' '}
          <span className="text-muted-foreground">a {shoutout.context === 'fan' ? 'beer' : 'round'}</span>
        </p>
        <div className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1">
          <Beer className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 tabular-nums">
            ${shoutout.amount.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Optional message */}
      {shoutout.message && (
        <blockquote className="rounded-xl bg-background/60 border border-border/60 px-3 py-2 text-sm italic text-foreground/90">
          “{shoutout.message}”
        </blockquote>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReact('cheers')}
          className="gap-1.5 h-9 px-2.5"
          aria-label="Cheers reaction"
        >
          <Beer className="h-4 w-4" />
          <span className="text-xs font-semibold tabular-nums">{cheers}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReact('likes')}
          className="gap-1.5 h-9 px-2.5"
          aria-label="Like"
        >
          <Heart className="h-4 w-4" />
          <span className="text-xs font-semibold tabular-nums">{likes}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="gap-1.5 h-9 px-2.5 ml-auto"
          aria-label="Share shoutout"
        >
          <Share2 className="h-4 w-4" />
          <span className="text-xs font-semibold">Share</span>
        </Button>
      </div>
    </article>
  );
}
