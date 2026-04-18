import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Clock, Users, Share2, Shield, ShieldCheck, MessageCircle, LogOut, Sparkles, Trophy,
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMeetupDetail, deriveVibeTags } from '@/hooks/useMeetups';
import { useJoinMeetup, useLeaveMeetup } from '@/hooks/useLineup';
import { ShareInviteSheet } from '@/components/meetups/ShareInviteSheet';
import { SafetyTimerModal } from '@/components/SafetyTimerModal';
import { LineupChat } from '@/components/lineup/LineupChat';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { GuestBanner } from '@/components/GuestBanner';
import { toast } from 'sonner';

function formatFull(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}
function formatRelative(iso: string) {
  const m = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (m < 0) return 'Started';
  if (m < 60) return `Starts in ${m}m`;
  const h = Math.floor(m / 60);
  return `Starts in ${h}h${m % 60 ? ` ${m % 60}m` : ''}`;
}

export default function MeetupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isGuest } = useGuestMode();
  const { data: meetup, isLoading } = useMeetupDetail(id);
  const joinMeetup = useJoinMeetup();
  const leaveMeetup = useLeaveMeetup();
  const [showShare, setShowShare] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showChat, setShowChat] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="mx-auto max-w-2xl px-4 pt-6 space-y-3">
          <div className="h-32 rounded-2xl bg-muted animate-pulse" />
          <div className="h-48 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!meetup) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="mx-auto max-w-2xl px-4 pt-10 text-center">
          <p className="text-sm text-muted-foreground">This meetup isn't around anymore.</p>
          <Button onClick={() => navigate('/meetups')} className="mt-4 rounded-full">
            Back to meetups
          </Button>
        </div>
      </div>
    );
  }

  const vibeTags = deriveVibeTags(meetup);
  const spotsLeft = Math.max(0, meetup.max_members - meetup.member_count);
  const isFull = spotsLeft === 0;

  const handleJoin = async () => {
    try {
      await joinMeetup.mutateAsync(meetup.id);
      toast.success("⚾ You're in! Want a safety timer?");
      setShowSafety(true);
    } catch {
      toast.error('Could not join — try again');
    }
  };

  const handleLeave = async () => {
    try {
      await leaveMeetup.mutateAsync(meetup.id);
      toast('Left the meetup');
    } catch {
      toast.error('Could not leave');
    }
  };

  return (
    <div className={`min-h-screen bg-background ${isGuest ? 'pb-20' : 'pb-32'}`}>
      <AppHeader />

      <main className="mx-auto max-w-2xl px-4 pt-3">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Hero card */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Meetup
              </div>
              <h1 className="text-2xl font-extrabold leading-tight text-foreground mt-1">
                {meetup.location_name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-foreground/80">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">{formatFull(meetup.meeting_time)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{formatRelative(meetup.meeting_time)}</p>
            </div>
            <Button
              onClick={() => setShowShare(true)}
              variant="outline"
              size="icon"
              className="rounded-full shrink-0"
              aria-label="Share meetup"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Vibe tags */}
          {vibeTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {vibeTags.map(tag => (
                <span
                  key={tag}
                  className="text-[10px] font-bold uppercase tracking-wide bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Capacity meter */}
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold">
              <Users className="h-4 w-4 text-primary" />
              {meetup.member_count} / {meetup.max_members} going
            </span>
            {isFull ? (
              <Badge variant="destructive" className="text-[10px]">FULL</Badge>
            ) : spotsLeft <= 2 ? (
              <Badge className="bg-secondary text-secondary-foreground text-[10px]">
                <Sparkles className="h-3 w-3 mr-0.5" /> Only {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left
              </Badge>
            ) : (
              <span className="text-muted-foreground">{spotsLeft} spots open</span>
            )}
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (meetup.member_count / meetup.max_members) * 100)}%` }}
            />
          </div>
        </section>

        {/* Host card */}
        {meetup.host && (
          <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Hosted by</p>
            <Link
              to={`/profile/${meetup.host.user_id}`}
              className="flex items-center gap-3 group"
            >
              <img
                src={meetup.host.profile_photo || '/placeholder.svg'}
                alt=""
                className="h-14 w-14 rounded-full object-cover border-2 border-primary/30"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-base font-bold text-foreground group-hover:underline">
                    {meetup.host.display_name}
                  </span>
                  {meetup.host.is_verified && (
                    <ShieldCheck className="h-4 w-4 text-primary" aria-label="Verified" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  <span>{meetup.host.fan_tier_emoji}</span>
                  <span className="font-semibold text-foreground/80">{meetup.host.fan_title}</span>
                  <span className="flex items-center gap-0.5">
                    <Trophy className="h-3 w-3" /> {meetup.host.fan_xp} XP
                  </span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Notes */}
        {meetup.description && (
          <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              From the host
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed italic">
              "{meetup.description}"
            </p>
          </section>
        )}

        {/* Trust signals */}
        <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Trust & safety
          </p>
          <ul className="space-y-2 text-xs">
            {meetup.host?.is_verified && (
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground/90">Host is a verified fan</span>
              </li>
            )}
            {meetup.mutual_count > 0 && (
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground/90">
                  <span className="font-bold">{meetup.mutual_count}</span> {meetup.mutual_count === 1 ? 'fan you\'ve matched with' : 'fans you\'ve matched with'} {meetup.mutual_count === 1 ? 'is' : 'are'} going
                </span>
              </li>
            )}
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground/90">Safety timer available after you RSVP</span>
            </li>
          </ul>
        </section>

        {/* Attendees */}
        <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Going ({meetup.attendees.length})
            </p>
          </div>
          <ul className="space-y-2.5">
            {meetup.attendees.map(a => (
              <li key={a.user_id}>
                <Link
                  to={`/profile/${a.user_id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-1.5 -mx-2 hover:bg-muted transition min-h-[52px]"
                >
                  <img
                    src={a.profile_photo || '/placeholder.svg'}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {a.display_name}
                      </span>
                      {a.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                      {a.is_host && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 font-bold">
                          HOST
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {a.fan_tier_emoji} {a.fan_title}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* Sticky RSVP bar */}
      <div className="fixed bottom-[68px] left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="mx-auto max-w-2xl flex gap-2">
          {meetup.is_member ? (
            <>
              <Button
                onClick={() => setShowChat(true)}
                className="flex-1 rounded-full h-12 font-bold gap-1.5"
              >
                <MessageCircle className="h-4 w-4" /> Group Chat
              </Button>
              {!meetup.is_host && (
                <Button
                  onClick={handleLeave}
                  variant="outline"
                  className="rounded-full h-12 gap-1.5 px-4"
                  aria-label="Leave meetup"
                >
                  <LogOut className="h-4 w-4" /> Leave
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={isFull || joinMeetup.isPending}
              className="flex-1 rounded-full h-12 font-bold text-base shadow-md"
            >
              {isFull ? 'Meetup is full' : joinMeetup.isPending ? 'Joining...' : "⚾ I'm In!"}
            </Button>
          )}
        </div>
      </div>

      <ShareInviteSheet
        open={showShare}
        onClose={() => setShowShare(false)}
        meetupId={meetup.id}
        meetupTitle={meetup.location_name}
      />
      <SafetyTimerModal
        open={showSafety}
        onClose={() => setShowSafety(false)}
        meetupId={meetup.id}
        locationName={meetup.location_name}
      />
      <LineupChat
        meetup={meetup as any}
        open={showChat}
        onClose={() => setShowChat(false)}
      />

      {isGuest && <GuestBanner />}
    </div>
  );
}
