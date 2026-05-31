/**
 * Public Profile (/u/:id) — simplified, mobile-first card shown when any
 * avatar is tapped. Includes Buddy Up CTA, badges row, crews row, and
 * a 3-dot menu with Report (bottom sheet) + Block.
 */
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MoreVertical, Flag, Ban, Loader2, MapPin, Ticket, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { SEOMeta } from '@/components/SEOMeta';
import { cn } from '@/lib/utils';

const NAVY = '#0E3386';
const RED = '#CC3433';

const REPORT_REASONS = [
  'Inappropriate behavior',
  'Spam',
  'Fake profile',
  'Other',
] as const;

type Crew = { id: string; name: string; badge_emoji: string };
type Badge = { key: string; label: string };

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: me } = useProfile();
  const queryClient = useQueryClient();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const isOwn = !id || id === user?.id;

  // Public profile fields via RPC (RLS-safe)
  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.rpc('get_public_profiles', {
        p_user_ids: [id],
        p_limit: 1,
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!id,
  });

  // Crews this user belongs to (best-effort — RLS may return only crews the
  // viewer also belongs to). For viewer's own profile this returns all.
  const { data: crews = [] } = useQuery<Crew[]>({
    queryKey: ['public-profile-crews', id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from('crew_members')
        .select('crews(id, name, badge_emoji)')
        .eq('user_id', id);
      return (data ?? [])
        .map((r: any) => r.crews)
        .filter(Boolean) as Crew[];
    },
    enabled: !!id,
  });

  const blockUser = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Missing');
      const current: string[] = (me?.blocked_users as string[]) ?? [];
      if (current.includes(id)) return;
      const { error } = await supabase
        .from('profiles')
        .update({ blocked_users: [...current, id] })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User blocked', {
        description: "You won't see each other anymore.",
      });
      queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      navigate('/discover');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not block user'),
  });

  const submitReport = async () => {
    if (!user || !id || !reportReason) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('safety_reports').insert({
        reporter_id: user.id,
        reported_user_id: id,
        reason: reportReason,
      });
      if (error && !error.message?.toLowerCase().includes('duplicate')) {
        throw error;
      }
      toast.success("Thanks for the report. We'll review it shortly.");
      setReportOpen(false);
      setReportReason('');
    } catch (e: any) {
      toast.error(e.message || 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const buddyUp = async () => {
    if (!user || !id) return;
    try {
      const { data, error } = await supabase.rpc('say_hi_to_buddy', {
        p_recipient_id: id,
      });
      if (error) throw error;
      const result = (data as any)?.result;
      if (result === 'sent') toast.success('Buddy request sent!');
      else if (result === 'auto_accepted') toast.success("You're buddies — say hi!");
      else if (result === 'already_connected') {
        toast('You\'re already buddies.');
        navigate('/messages');
      } else if (result === 'already_sent') toast('Request already pending.');
    } catch (e: any) {
      toast.error(e.message || 'Could not send buddy request');
    }
  };

  // Derived display
  const fanSinceYear = useMemo(() => {
    if (!profile?.created_at) return new Date().getFullYear();
    return new Date(profile.created_at as string).getFullYear();
  }, [profile?.created_at]);

  const badges: Badge[] = useMemo(() => {
    if (!profile) return [];
    const list: Badge[] = [];
    if ((profile as any).is_verified) list.push({ key: 'verified', label: 'Verified Fan' });
    if ((profile as any).fan_tier) list.push({ key: 'tier', label: (profile as any).fan_tier });
    if ((profile as any).fan_title) list.push({ key: 'title', label: (profile as any).fan_title });
    if ((profile as any).gameday_persona) list.push({ key: 'persona', label: (profile as any).gameday_persona });
    ((profile as any).fan_style as string[] | undefined)?.forEach((s) =>
      list.push({ key: `style-${s}`, label: s }),
    );
    return list.slice(0, 12);
  }, [profile]);

  const gamesAttended = (profile as any)?.fan_xp ?? 0;

  if (!id) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <ConceptIcon name="baseball" className="mb-3 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold" style={{ color: NAVY, fontFamily: 'Norwester, sans-serif' }}>
          Fan not found
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">They may have stepped away.</p>
        <Button className="mt-5 rounded-full" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <SEOMeta
        title={`${profile.display_name || 'Fan'} — Cubbies Buddies`}
        description={`See ${profile.display_name || 'this fan'}'s Wrigleyville profile, crews and badges.`}
      />

      {/* Header bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-background/90 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {!isOwn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-muted"
                aria-label="More options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setReportOpen(true)}
                className="min-h-[44px] gap-2"
              >
                <Flag className="h-4 w-4" /> Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => blockUser.mutate()}
                className="min-h-[44px] gap-2 text-destructive focus:text-destructive"
              >
                <Ban className="h-4 w-4" /> Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mx-auto max-w-md px-5">
        {/* Avatar + identity */}
        <div className="flex flex-col items-center pt-2 text-center">
          <div className="relative">
            <div
              className="h-36 w-36 overflow-hidden rounded-full"
              style={{ border: `5px solid ${NAVY}`, background: '#eef1f7' }}
            >
              {profile.profile_photo ? (
                <img
                  src={profile.profile_photo}
                  alt={profile.display_name || 'Fan'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ConceptIcon name="baseball" className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            {(profile as any).is_season_ticket_holder && (
              <STHBadge size="lg" className="absolute bottom-1 right-1 ring-4 ring-background" />
            )}
          </div>

          <h1
            className="mt-4 text-3xl font-bold tracking-tight"
            style={{ color: NAVY, fontFamily: 'Norwester, sans-serif' }}
          >
            {profile.display_name || 'Cubbie Fan'}
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Cubs fan since {fanSinceYear}
          </p>

          {/* Section tag + games attended */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {profile.wrigley_section && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                style={{ background: NAVY }}
              >
                <MapPin className="h-3.5 w-3.5" />
                {profile.wrigley_section}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold"
              style={{ borderColor: NAVY, color: NAVY }}
            >
              <Ticket className="h-3.5 w-3.5" />
              {gamesAttended} games attended
            </span>
          </div>
        </div>

        {/* Badges row */}
        <Section title="Badges">
          {badges.length > 0 ? (
            <div className="-mx-5 overflow-x-auto px-5">
              <div className="flex gap-2 pb-1">
                {badges.map((b) => (
                  <span
                    key={b.key}
                    className="shrink-0 rounded-full border-2 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm"
                    style={{ borderColor: RED, color: NAVY }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <EmptyRow text="No badges yet — keep showing up." />
          )}
        </Section>

        {/* Crews */}
        <Section title="Crews">
          {crews.length > 0 ? (
            <div className="-mx-5 overflow-x-auto px-5">
              <div className="flex gap-3 pb-1">
                {crews.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/crews/${c.id}`)}
                    className="flex w-28 shrink-0 flex-col items-center gap-2 rounded-2xl border-2 bg-white p-3 text-center shadow-sm transition active:scale-[0.98]"
                    style={{ borderColor: '#e2e6ee', minHeight: 96 }}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ background: NAVY }}
                    >
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <p
                      className="line-clamp-2 text-xs font-bold leading-tight"
                      style={{ color: NAVY }}
                    >
                      {c.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <EmptyRow text="Not in any crews yet." />
          )}
        </Section>
      </div>

      {/* Sticky Buddy Up CTA (only if not own profile) */}
      {!isOwn && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-5 py-3 backdrop-blur">
          <div className="mx-auto max-w-md">
            <Button
              onClick={buddyUp}
              className="h-14 w-full rounded-full text-base font-bold text-white shadow-lg transition hover:opacity-90"
              style={{ background: RED }}
            >
              Buddy Up
            </Button>
          </div>
        </div>
      )}

      {/* Report sheet */}
      <Sheet open={reportOpen} onOpenChange={setReportOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-5">
          <SheetHeader className="text-left">
            <SheetTitle
              className="text-2xl font-bold"
              style={{ color: NAVY, fontFamily: 'Norwester, sans-serif' }}
            >
              Report this fan
            </SheetTitle>
            <SheetDescription>
              Pick a reason — moderators will review it shortly.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-2">
            {REPORT_REASONS.map((reason) => {
              const selected = reportReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setReportReason(reason)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl border-2 px-4 text-left font-semibold transition',
                    'min-h-[56px]',
                  )}
                  style={{
                    borderColor: selected ? NAVY : '#d6d9e2',
                    background: selected ? NAVY : 'white',
                    color: selected ? 'white' : '#1a1f2e',
                  }}
                  aria-pressed={selected}
                >
                  <span>{reason}</span>
                  {selected && (
                    <span
                      className="ml-3 flex h-5 w-5 items-center justify-center rounded-full text-xs"
                      style={{ background: 'white', color: NAVY }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            onClick={submitReport}
            disabled={!reportReason || submitting}
            className="mt-6 h-14 w-full rounded-full text-base font-bold text-white hover:opacity-90"
            style={{ background: reportReason ? RED : '#9aa3b8' }}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2
        className="mb-3 text-sm font-bold uppercase tracking-widest"
        style={{ color: NAVY }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl border-2 border-dashed px-4 py-5 text-center text-sm text-muted-foreground"
      style={{ borderColor: '#d6d9e2' }}
    >
      {text}
    </div>
  );
}
