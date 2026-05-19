import { Link } from 'react-router-dom';
import { Clock, Users, MapPin, Sparkles, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { deriveVibeTags, deriveMeetupCategory } from '@/hooks/useMeetups';
import type { LineupMeetup } from '@/hooks/useLineup';
import { MeetupCategoryBadge } from '@/components/meetups/MeetupCategoryBadge';
import { stripEmoji } from '@/components/icons/ConceptIcon';
import { PreGameCountdownPill } from '@/components/gameday/PreGameCountdownPill';
import { ShareMenu } from '@/components/share/ShareMenu';

interface MeetupCardProps {
  meetup: LineupMeetup & { is_verified?: boolean; fan_tier_emoji?: string };
}

function formatRelative(iso: string) {
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (diffMin < -5) return 'Earlier today';
  if (diffMin < 0) return 'Now';
  if (diffMin < 60) return `in ${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m === 0 ? `in ${h}h` : `in ${h}h ${m}m`;
}

function formatAbs(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function MeetupCard({ meetup }: MeetupCardProps) {
  const vibeTags = deriveVibeTags(meetup);
  const category = deriveMeetupCategory(meetup);
  const cleanLocation = stripEmoji(meetup.location_name);
  const cleanDesc = stripEmoji(meetup.description || '');
  const spotsLeft = Math.max(0, meetup.max_members - (meetup.member_count ?? 0));
  const isFull = spotsLeft === 0;
  const isStartingSoon = (() => {
    const m = (new Date(meetup.meeting_time).getTime() - Date.now()) / 60000;
    return m >= 0 && m <= 30;
  })();

  return (
    <Link
      to={`/meetups/${meetup.id}`}
      className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition active:scale-[0.99] hover:shadow-md hover:border-primary/30"
      aria-label={`Meetup at ${cleanLocation}`}
    >
      {/* Pre-game countdown — only renders during the 3h pre-game window */}
      <div className="mb-2 flex">
        <PreGameCountdownPill />
      </div>

      {/* Top row: host + status pill */}
      <div className="flex items-start gap-3">
        <img
          src={meetup.creator_photo || '/placeholder.svg'}
          alt=""
          className="h-11 w-11 rounded-full object-cover border-2 border-primary/20 shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-foreground truncate">
              {stripEmoji(meetup.creator_name)}
            </span>
            {meetup.is_verified && (
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" aria-label="Verified host" />
            )}
            <span className="text-[11px] text-muted-foreground">· hosting</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-sm text-foreground/90">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-semibold truncate">{cleanLocation}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isStartingSoon && !isFull && (
            <Badge className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 font-bold">
              <Sparkles className="h-3 w-3 mr-0.5" /> Soon
            </Badge>
          )}
          <ShareMenu
            size="sm"
            title="Share this meetup"
            shareTitle={cleanLocation}
            location={cleanLocation}
            shareUrl={`${typeof window !== 'undefined' ? window.location.origin : 'https://cubbiesbuddies.com'}/meetups/${meetup.id}`}
          />
        </div>
      </div>

      {/* Category + Description */}
      {(category || cleanDesc) && (
        <div className="mt-2.5 flex items-start gap-2 flex-wrap">
          {category && <MeetupCategoryBadge category={category} size="sm" />}
          {cleanDesc && (
            <p className="text-xs text-foreground/70 italic leading-relaxed line-clamp-2 flex-1 min-w-0">
              "{cleanDesc}"
            </p>
          )}
        </div>
      )}

      {/* Vibe tags */}
      {vibeTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {vibeTags.map(tag => (
            <span
              key={tag}
              className="text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: time + attendance */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="h-3.5 w-3.5" />
            {formatAbs(meetup.meeting_time)}
            <span className="text-foreground/60">· {formatRelative(meetup.meeting_time)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground">{meetup.member_count}</span>
          <span className="text-muted-foreground">/{meetup.max_members}</span>
          {isFull ? (
            <span className="ml-1.5 text-[10px] text-destructive font-bold">FULL</span>
          ) : spotsLeft <= 2 ? (
            <span className="ml-1.5 text-[10px] text-secondary font-bold">{spotsLeft} left</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
