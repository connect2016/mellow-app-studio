import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicBackground } from '@/components/DynamicBackground';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Beer,
  X,
  ShieldCheck,
  MapPin,
  Clock,
  AlertTriangle,
  Users,
  ChevronRight,
  Sparkles,
  Map as MapIcon,
  Star,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { findParticipatingBar, PARTICIPATING_BARS } from '@/lib/wrigleyville-bar-coords';
import { BarLocationPreview } from '@/components/BarLocationPreview';

const AMOUNTS = [
  { value: 5, label: '$5', emoji: '🍺', desc: 'A draft' },
  { value: 8, label: '$8', emoji: '🍻', desc: 'A craft pint' },
  { value: 12, label: '$12', emoji: '🥃', desc: 'Top shelf' },
  { value: 15, label: '$15', emoji: '🍕', desc: 'Beer + slice' },
  { value: 25, label: '$25', emoji: '🎉', desc: 'A round' },
];

const QUICK_MESSAGES = [
  "🍺 First round's on me!",
  '⚾ Go Cubs! Cheers!',
  '🎉 Great game today!',
  '🤝 Nice meeting you!',
  '🏟️ Wish I was there!',
];

function formatActive(iso?: string | null) {
  if (!iso) return null;
  const diffMin = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 2) return 'Active now';
  if (diffMin < 60) return `Active ${diffMin}m ago`;
  const hr = Math.floor(diffMin / 60);
  if (hr < 24) return `Active ${hr}h ago`;
  return null;
}

export default function BeerMoney() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toUserId = params.get('to');
  const meetupId = params.get('meetup');
  const barName = params.get('bar');
  const recipientType: 'fan' | 'meetup' | 'bar' | null = toUserId
    ? 'fan'
    : meetupId
    ? 'meetup'
    : barName
    ? 'bar'
    : null;

  const [amount, setAmount] = useState<number>(5);
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFanPicker, setShowFanPicker] = useState(!recipientType);

  // Recent beer money activity (social proof — mock for now)
  const recentActivity = useMemo(
    () => [
      { name: 'Jake M.', bar: "Murphy's Bleachers", time: '2m ago' },
      { name: 'Sarah K.', bar: 'Sluggers', time: '8m ago' },
      { name: 'Mike R.', bar: 'Cubby Bear', time: '14m ago' },
    ],
    []
  );

  // Nearby fans
  const { data: nearbyFans, isLoading: loadingNearbyFans } = useQuery({
    queryKey: ['beer-nearby-fans', user?.id],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.rpc('get_public_profiles', {
        p_only_onboarded: true,
        p_exclude_ids: user?.id ? [user.id] : null,
        p_active_since: sixHoursAgo,
        p_limit: 8,
      });
      return data ?? [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Recipient: Fan
  const { data: toUser, isLoading: loadingFan } = useQuery({
    queryKey: ['beer-recipient-fan', toUserId],
    queryFn: async () => {
      if (!toUserId) return null;
      const { data } = await supabase.rpc('get_public_profiles', {
        p_user_ids: [toUserId],
        p_limit: 1,
      });
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!toUserId,
  });

  // Recipient: Meetup
  const { data: toMeetup, isLoading: loadingMeetup } = useQuery({
    queryKey: ['beer-recipient-meetup', meetupId],
    queryFn: async () => {
      if (!meetupId) return null;
      const { data } = await supabase
        .from('lineup_meetups')
        .select('id, location_name, meeting_time, max_members, creator_id, status')
        .eq('id', meetupId)
        .maybeSingle();
      if (!data) return null;
      const { count } = await supabase
        .from('lineup_members')
        .select('id', { count: 'exact', head: true })
        .eq('meetup_id', meetupId);
      return { ...data, member_count: count ?? 0 };
    },
    enabled: !!meetupId,
  });

  const isAdult = (toUser?.age ?? 21) >= 21;
  const isFanRecipientInvalid = recipientType === 'fan' && toUser && !isAdult;
  const participatingBar = recipientType === 'bar' ? findParticipatingBar(barName) : null;
  const isBarRecipientInvalid = recipientType === 'bar' && !participatingBar;

  // Resolve bar for meetup or fan location
  const redeemBar = useMemo(() => {
    if (participatingBar) return participatingBar;
    if (toUser?.wrigleyville_bar) return findParticipatingBar(toUser.wrigleyville_bar);
    if (toMeetup?.location_name) return findParticipatingBar(toMeetup.location_name);
    return null;
  }, [participatingBar, toUser, toMeetup]);

  const isAmountValid = amount >= 3 && amount <= 25;
  const hasRecipient = !!recipientType && (toUser || toMeetup || barName);
  const canSend = isAmountValid && hasRecipient && !isFanRecipientInvalid && !isBarRecipientInvalid;

  const recipientLabel = toUser?.display_name || toMeetup?.location_name || barName || '';
  const contextualCTA = toUser
    ? `Buy ${toUser.display_name?.split(' ')[0] || 'them'} a Beer`
    : toMeetup
    ? `Send a Round to ${toMeetup.location_name}`
    : barName
    ? `Buy a Beer at ${barName}`
    : 'Pick a Fan First';

  const isLoadingRecipient =
    (recipientType === 'fan' && loadingFan) || (recipientType === 'meetup' && loadingMeetup);

  const handleSend = () => {
    setShowConfirm(false);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      toast({
        title: '🍺 Cheers! Beer Money Sent!',
        description: `$${amount} sent to ${recipientLabel}${note ? ` — "${note}"` : ''}`,
      });
    }, 2800);
  };

  return (
    <DynamicBackground>
      <AppHeader />

      {/* ===== Celebration overlay ===== */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14 }}
              className="text-center px-6"
            >
              <div className="relative mb-6 flex items-end justify-center gap-1">
                <motion.span
                  initial={{ x: -40, rotate: -20, opacity: 0 }}
                  animate={{ x: 0, rotate: -8, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                  className="text-6xl"
                >
                  🍺
                </motion.span>
                <motion.span
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="text-3xl mb-3"
                >
                  🤝
                </motion.span>
                <motion.span
                  initial={{ x: 40, rotate: 20, opacity: 0 }}
                  animate={{ x: 0, rotate: 8, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                  className="text-6xl"
                >
                  🍺
                </motion.span>
              </div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-2xl font-bold text-primary-foreground mb-2"
              >
                Cheers! 🎉
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-primary-foreground/80"
              >
                ${amount} sent to {recipientLabel}
              </motion.p>
              {redeemBar && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="mt-1 text-sm text-primary-foreground/60"
                >
                  Redeemable at {redeemBar.name}
                </motion.p>
              )}
            </motion.div>
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-primary-foreground/20"
                style={{
                  width: Math.random() * 14 + 6,
                  height: Math.random() * 14 + 6,
                  left: `${20 + Math.random() * 60}%`,
                  bottom: '10%',
                }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 0.6, 0], y: [0, -(Math.random() * 300 + 100)] }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 1,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 0.5,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-lg px-4 pt-3 pb-28">
        {/* Back nav */}
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {/* Hero header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">
            <Sparkles className="h-3 w-3" /> Social · Wrigleyville
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground leading-tight">
            Beer Money 🍺
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buy a real beer for a fan at a real Wrigleyville bar.
          </p>
        </div>

        {/* ===== SOCIAL PROOF STRIP ===== */}
        <div className="mb-5 overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <p className="text-[11px] font-semibold text-foreground">Recent rounds bought</p>
          </div>
          <div className="divide-y divide-border/30">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2">
                <span className="text-sm">🍺</span>
                <p className="flex-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{a.name}</span> bought a beer at{' '}
                  <span className="font-semibold text-foreground">{a.bar}</span>
                </p>
                <span className="text-[10px] text-muted-foreground">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== STEP 1: RECIPIENT ===== */}
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              1
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              Who's getting a beer?
            </p>
          </div>

          {/* No recipient — show picker */}
          {!recipientType && (
            <div className="space-y-3">
              {/* Quick pick: nearby fans */}
              {nearbyFans && nearbyFans.length > 0 && (
                <div className="rounded-xl border border-border bg-card/60 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    🧊 Active fans nearby
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {nearbyFans.map((f: any) => (
                      <button
                        key={f.user_id}
                        onClick={() => navigate(`/beer-money?to=${f.user_id}`)}
                        className="flex flex-col items-center gap-1 rounded-xl p-2 hover:bg-muted/60 transition-colors shrink-0 w-16"
                      >
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-primary/20">
                          {f.profile_photo ? (
                            <img
                              src={f.profile_photo}
                              alt={f.display_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
                              {f.display_name?.charAt(0)}
                            </div>
                          )}
                          {f.location_last_set_at &&
                            Date.now() - new Date(f.location_last_set_at).getTime() < 10 * 60_000 && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                            )}
                        </div>
                        <span className="text-[10px] font-medium text-foreground truncate w-full text-center">
                          {f.display_name?.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation shortcuts */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/bar-map"
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card/60 px-3 py-3 transition hover:border-primary/40 active:scale-[0.98]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                    <MapIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground">Beer Map</p>
                    <p className="text-[10px] text-muted-foreground">Pick a bar</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
                <Link
                  to="/meetups"
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card/60 px-3 py-3 transition hover:border-primary/40 active:scale-[0.98]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground">Live Meetups</p>
                    <p className="text-[10px] text-muted-foreground">Buy a round</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </div>

              {/* Participating bars quick list */}
              <div className="rounded-xl border border-border bg-card/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  🗺️ Participating venues
                </p>
                <div className="space-y-1">
                  {PARTICIPATING_BARS.slice(0, 4).map((bar) => (
                    <Link
                      key={bar.slug}
                      to={`/beer-money?bar=${encodeURIComponent(bar.name)}`}
                      className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted/60 transition-colors"
                    >
                      <span className="text-sm">🍺</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">{bar.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{bar.address}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </div>
                <Link
                  to="/bar-map"
                  className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  View all {PARTICIPATING_BARS.length} venues <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Loading */}
          {recipientType && isLoadingRecipient && (
            <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="h-3 w-1/3 rounded bg-muted" />
                </div>
              </div>
            </div>
          )}

          {/* ---- FAN RECIPIENT ---- */}
          {recipientType === 'fan' && toUser && (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Link
                    to={`/profile/${toUser.user_id}`}
                    className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-primary/20"
                  >
                    {toUser.profile_photo ? (
                      <img src={toUser.profile_photo} alt={toUser.display_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground">
                        {toUser.display_name?.charAt(0)}
                      </div>
                    )}
                    {toUser.location_last_set_at &&
                      Date.now() - new Date(toUser.location_last_set_at).getTime() < 10 * 60_000 && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                      )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold text-foreground">{toUser.display_name}</p>
                      {toUser.fan_tier_emoji && <span className="text-sm">{toUser.fan_tier_emoji}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {toUser.is_verified && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                          <ShieldCheck className="h-2.5 w-2.5" /> Verified
                        </span>
                      )}
                      {isAdult ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          21+
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                          <AlertTriangle className="h-2.5 w-2.5" /> Under 21
                        </span>
                      )}
                    </div>
                    {toUser.wrigleyville_bar && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span className="truncate">At {toUser.wrigleyville_bar}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/beer-money')}
                    className="text-[10px] font-semibold text-primary hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>
              </div>
              {/* Under 21 block */}
              {!isAdult && (
                <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-2.5">
                  <p className="text-[11px] font-semibold text-destructive">
                    🚫 You can't send Beer Money to fans under 21.
                  </p>
                </div>
              )}
              {/* Map preview for fan's bar */}
              {isAdult && redeemBar && (
                <div className="border-t border-border p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    📍 Redeemable at
                  </p>
                  <BarLocationPreview bar={redeemBar} />
                </div>
              )}
            </div>
          )}

          {/* ---- MEETUP RECIPIENT ---- */}
          {recipientType === 'meetup' && toMeetup && (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl">
                    🍻
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{toMeetup.location_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Live Meetup
                      </span>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-2.5 w-2.5" /> 21+ venue
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {toMeetup.member_count}/{toMeetup.max_members} fans
                      </span>
                      {toMeetup.meeting_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(toMeetup.meeting_time).toLocaleString([], {
                            weekday: 'short',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/beer-money')}
                    className="text-[10px] font-semibold text-primary hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>
              </div>
              <div className="border-t border-border/50 bg-muted/30 px-4 py-2">
                <p className="text-[10px] text-muted-foreground">
                  💡 Split across attendees who've checked in at the bar.
                </p>
              </div>
              {redeemBar && (
                <div className="border-t border-border p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    📍 Redeemable at
                  </p>
                  <BarLocationPreview bar={redeemBar} />
                </div>
              )}
            </div>
          )}

          {/* ---- BAR RECIPIENT ---- */}
          {recipientType === 'bar' && barName && (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              {participatingBar ? (
                <>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xl">
                        🍺
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{barName}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                            <Star className="h-2.5 w-2.5" /> Participating venue
                          </span>
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-2.5 w-2.5" /> 21+
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span className="truncate">{participatingBar.address}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/beer-money')}
                        className="text-[10px] font-semibold text-primary hover:underline shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-border p-3">
                    <BarLocationPreview bar={participatingBar} />
                  </div>
                </>
              ) : (
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xl">
                      ⚠️
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{barName}</p>
                      <p className="text-[11px] text-destructive font-medium">Not a participating venue</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Beer Money can only be redeemed at verified Wrigleyville bars.
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full rounded-xl text-xs">
                    <Link to="/bar-map">🗺️ Pick from the Beer Map</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ===== STEP 2: AMOUNT (only when recipient is set) ===== */}
        {hasRecipient && !isFanRecipientInvalid && !isBarRecipientInvalid && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                2
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Pick your round
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {AMOUNTS.map((a) => (
                <motion.button
                  key={a.value}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAmount(a.value)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border py-3 transition-all ${
                    amount === a.value
                      ? 'border-primary bg-primary/10 shadow-sm shadow-primary/10'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <span className="text-lg">{a.emoji}</span>
                  <span className={`text-sm font-bold ${amount === a.value ? 'text-primary' : 'text-foreground'}`}>
                    {a.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{a.desc}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* ===== STEP 3: MESSAGE (only when recipient is set) ===== */}
        {hasRecipient && !isFanRecipientInvalid && !isBarRecipientInvalid && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-5"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                3
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Add a message <span className="font-normal normal-case text-muted-foreground">(optional)</span>
              </p>
            </div>

            {/* Quick message chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
              {QUICK_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  type="button"
                  onClick={() => setNote(msg)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    note === msg
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {msg}
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Or type your own message…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl min-h-[60px]"
              maxLength={120}
            />
            <p className="text-[10px] text-muted-foreground text-right mt-1">{note.length}/120</p>
          </motion.section>
        )}

        {/* ===== 21+ TRUST BANNER ===== */}
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <div>
            <p className="text-[11px] font-semibold text-foreground mb-0.5">21+ Verified Experience</p>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              By sending Beer Money you confirm you're 21+. Funds are redeemable only at verified
              Wrigleyville venues. No alcohol is delivered through the app.
            </p>
          </div>
        </div>

        {/* ===== CTA BUTTON ===== */}
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={!canSend}
          className="w-full rounded-2xl py-6 text-base font-semibold gap-2 shadow-lg shadow-primary/20"
        >
          <Beer className="h-5 w-5" />
          {contextualCTA}
          {canSend && <span className="ml-1 opacity-80">· ${amount}</span>}
        </Button>

        {/* ===== CREDITS UPSELL ===== */}
        <div className="mt-6 rounded-xl border border-border bg-card/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🎟️</span>
            <p className="text-xs font-bold text-foreground">Beer Money Credits</p>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Pre-load credits → skip checkout every time.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { credits: 25, price: 25, bonus: '' },
              { credits: 55, price: 50, bonus: '+$5 free' },
              { credits: 120, price: 100, bonus: '+$20 free' },
            ].map((pkg) => (
              <button
                key={pkg.price}
                onClick={() =>
                  toast({ title: 'Coming soon!', description: 'Credit packs require payment integration' })
                }
                className="rounded-xl border border-border bg-card p-2.5 text-center hover:border-primary/40 transition-colors"
              >
                <p className="text-base font-bold text-primary">${pkg.credits}</p>
                <p className="text-[10px] text-muted-foreground">for ${pkg.price}</p>
                {pkg.bonus && (
                  <p className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">{pkg.bonus}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ===== CONFIRMATION MODAL ===== */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4"
              onClick={() => setShowConfirm(false)}
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-foreground">Confirm your round</h3>
                  <button onClick={() => setShowConfirm(false)} className="p-1 rounded-full hover:bg-muted">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="rounded-xl bg-muted/40 p-4 text-center mb-4">
                  <p className="text-3xl mb-2">🍺</p>
                  <p className="text-foreground">
                    Sending <span className="font-bold text-primary">${amount}</span> to{' '}
                    <span className="font-bold">{recipientLabel}</span>
                  </p>
                  {redeemBar && (
                    <p className="mt-1 text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <MapPin className="h-3 w-3" /> Redeemable at {redeemBar.name}
                    </p>
                  )}
                  {note && <p className="mt-2 text-sm text-muted-foreground italic">"{note}"</p>}
                </div>

                {/* Trust confirmation */}
                <div className="flex items-start gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5 mb-4">
                  <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                  <p className="text-[10px] text-muted-foreground">
                    You confirm you're 21+ and the recipient is a verified adult fan at a participating venue.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowConfirm(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 rounded-xl gap-1 font-semibold" onClick={handleSend}>
                    {contextualCTA} 🍺
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DynamicBackground>
  );
}
