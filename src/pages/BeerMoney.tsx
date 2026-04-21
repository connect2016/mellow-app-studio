import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Share2,
  Trophy,
  Flame,
  Gift,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  Zap,
  Crown,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { findParticipatingBar, PARTICIPATING_BARS, type ParticipatingBar } from '@/lib/wrigleyville-bar-coords';
import { BarLocationPreview } from '@/components/BarLocationPreview';
import { SendToNonUserPanel } from '@/components/beer/SendToNonUserPanel';
import { LiveBeerProof, BeerFomoToast } from '@/components/beer/LiveBeerProof';
import { useLiveBeerFeed } from '@/hooks/useLiveBeerFeed';

/* ─── Constants ─── */
const AMOUNTS = [
  { value: 5, label: '$5', emoji: '🍺', desc: 'A cold one', tag: '' },
  { value: 8, label: '$8', emoji: '🍻', desc: 'Craft pint', tag: '' },
  { value: 12, label: '$12', emoji: '🥃', desc: 'Top shelf', tag: 'Popular' },
  { value: 15, label: '$15', emoji: '🍕', desc: 'Beer + slice', tag: '' },
  { value: 25, label: '$25', emoji: '🎉', desc: 'A full round', tag: '🔥' },
];

const QUICK_MESSAGES = [
  "🍺 First round's on me!",
  '⚾ Go Cubs! Cheers!',
  '🎉 Great game today!',
  '🤝 Nice meeting you!',
  '🏟️ Wish I was there!',
  '🐻 Cubs win! Drinks on me!',
];

const MOCK_FEED = [
  { from: 'Jake M.', to: 'Mike R.', bar: "Murphy's Bleachers", amount: 8, emoji: '🍻', time: '45s ago', msg: 'Go Cubs!' },
  { from: 'Sarah K.', to: 'Chris P.', bar: 'Sluggers', amount: 12, emoji: '🥃', time: '2m ago', msg: 'Great catch earlier!' },
  { from: 'Alex T.', to: 'Devon L.', bar: 'Cubby Bear', amount: 5, emoji: '🍺', time: '5m ago', msg: '' },
  { from: 'Mia J.', to: 'Round @ Old Crow', bar: 'Old Crow Smokehouse', amount: 25, emoji: '🎉', time: '8m ago', msg: "Let's gooo!" },
  { from: 'Tyler B.', to: 'Sam W.', bar: "Casey Moran's", amount: 8, emoji: '🍻', time: '12m ago', msg: '' },
];

const LEADERBOARD_MOCK = [
  { name: 'Jake M.', rounds: 14, emoji: '👑' },
  { name: 'Sarah K.', rounds: 11, emoji: '🔥' },
  { name: 'Mike R.', rounds: 9, emoji: '⚡' },
  { name: 'Chris P.', rounds: 7, emoji: '🍺' },
  { name: 'Mia J.', rounds: 6, emoji: '🍻' },
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

/* ─── Main Component ─── */
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

  const [amount, setAmount] = useState<number>(12);
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'feed' | 'leaderboard'>('send');
  const [showNonUserSend, setShowNonUserSend] = useState(false);
  const [claimLinkUrl, setClaimLinkUrl] = useState('');

  // Nearby fans
  const { data: nearbyFans } = useQuery({
    queryKey: ['beer-nearby-fans', user?.id],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.rpc('get_public_profiles', {
        p_only_onboarded: true,
        p_exclude_ids: user?.id ? [user.id] : null,
        p_active_since: sixHoursAgo,
        p_limit: 12,
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
  const { data: toMeetup } = useQuery({
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
  const firstName = toUser?.display_name?.split(' ')[0] || 'them';
  const contextualCTA = toUser
    ? `Buy ${firstName} a Beer 🍺`
    : toMeetup
    ? `Send a Round 🍻`
    : barName
    ? `Buy a Beer at ${barName}`
    : 'Pick a Fan';

  const isLoadingRecipient =
    (recipientType === 'fan' && loadingFan);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/beer-money${toUserId ? `?to=${toUserId}` : barName ? `?bar=${encodeURIComponent(barName)}` : ''}`
    : '';

  const handleShare = useCallback(async () => {
    const shareData = {
      title: '🍺 Beer Money — Cubbies Buddies',
      text: `I just bought ${recipientLabel || 'a fan'} a beer on Cubbies Buddies! Join the fun in Wrigleyville.`,
      url: shareUrl,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Link copied!', description: 'Share it with your crew 🤝' });
    }
  }, [recipientLabel, shareUrl, toast]);

  const handleSend = () => {
    setShowConfirm(false);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
    }, 3500);
  };

  return (
    <DynamicBackground>
      <AppHeader />

      {/* ===== CELEBRATION OVERLAY ===== */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary/95 backdrop-blur-md"
          >
            {/* Confetti particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 10 + 4,
                  height: Math.random() * 10 + 4,
                  left: `${10 + Math.random() * 80}%`,
                  top: `${Math.random() * 100}%`,
                  background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][i % 6],
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.5, 1, 0.5],
                  y: [0, -(Math.random() * 200 + 100)],
                  x: [(Math.random() - 0.5) * 100],
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 2.5, delay: Math.random() * 0.5, ease: 'easeOut' }}
              />
            ))}

            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="text-center px-6"
            >
              {/* Clinking beers */}
              <div className="relative mb-6 flex items-end justify-center gap-0">
                <motion.span
                  initial={{ x: -60, rotate: -30, opacity: 0 }}
                  animate={{ x: 0, rotate: -12, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.5, type: 'spring' }}
                  className="text-7xl"
                >🍺</motion.span>
                <motion.span
                  initial={{ y: -40, opacity: 0, scale: 0 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4, type: 'spring' }}
                  className="text-4xl mb-4 -mx-2"
                >💥</motion.span>
                <motion.span
                  initial={{ x: 60, rotate: 30, opacity: 0 }}
                  animate={{ x: 0, rotate: 12, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.5, type: 'spring' }}
                  className="text-7xl"
                >🍺</motion.span>
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-3xl font-bold text-primary-foreground mb-1"
              >
                Cheers! 🎉
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-lg text-primary-foreground/90 mb-1"
              >
                ${amount} sent to <span className="font-bold">{recipientLabel}</span>
              </motion.p>
              {redeemBar && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="text-sm text-primary-foreground/60 flex items-center justify-center gap-1"
                >
                  <MapPin className="h-3 w-3" /> {redeemBar.name}
                </motion.p>
              )}
              {note && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="mt-2 text-sm text-primary-foreground/50 italic"
                >"{note}"</motion.p>
              )}

              {/* Post-send viral CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="mt-6 flex flex-col gap-2"
              >
                <Button
                  onClick={handleShare}
                  variant="secondary"
                  className="rounded-2xl gap-2 text-sm font-semibold"
                >
                  <Share2 className="h-4 w-4" />
                  Share & Invite Friends
                </Button>
                <button
                  onClick={() => { setShowCelebration(false); navigate('/beer-money'); }}
                  className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                >
                  Buy another round →
                </button>
              </motion.div>
            </motion.div>
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

        {/* ===== HERO ===== */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">
            <Sparkles className="h-3 w-3" /> Social · Wrigleyville · Live
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground leading-tight">
            Beer Money 🍺
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buy a real beer for a real fan at a real Wrigleyville bar. Every round starts a connection.
          </p>
        </div>

        {/* ===== STATS BAR ===== */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            { icon: <Beer className="h-3.5 w-3.5" />, label: 'Rounds today', value: '47', color: 'text-primary' },
            { icon: <Users className="h-3.5 w-3.5" />, label: 'Fans active', value: '23', color: 'text-emerald-500' },
            { icon: <TrendingUp className="h-3.5 w-3.5" />, label: 'Your rounds', value: '3', color: 'text-amber-500' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-card/60 p-2.5 text-center">
              <div className={`flex items-center justify-center gap-1 ${s.color} mb-0.5`}>
                {s.icon}
                <span className="text-lg font-bold">{s.value}</span>
              </div>
              <p className="text-[9px] text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ===== TAB NAVIGATION ===== */}
        <div className="mb-4 flex rounded-xl border border-border bg-card/60 p-1">
          {[
            { key: 'send' as const, label: 'Send a Beer', icon: <Beer className="h-3.5 w-3.5" /> },
            { key: 'feed' as const, label: 'Live Feed', icon: <Zap className="h-3.5 w-3.5" /> },
            { key: 'leaderboard' as const, label: 'Top Buyers', icon: <Trophy className="h-3.5 w-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* ===== TAB: LIVE FEED ===== */}
        {activeTab === 'feed' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <p className="text-xs font-bold text-foreground">Live beer transactions</p>
            </div>

            {MOCK_FEED.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card/60 p-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      <span className="font-bold">{item.from}</span>
                      {' → '}
                      <span className="font-bold">{item.to}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" /> {item.bar}
                      </span>
                    </div>
                    {item.msg && (
                      <p className="mt-1 text-[11px] text-muted-foreground italic">"{item.msg}"</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-primary">${item.amount}</p>
                    <p className="text-[9px] text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* CTA at bottom of feed */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-sm font-bold text-foreground mb-1">Join the action! 🎯</p>
              <p className="text-xs text-muted-foreground mb-3">Buy a fan a beer and show up in the feed.</p>
              <Button onClick={() => setActiveTab('send')} className="rounded-2xl gap-2 text-sm">
                <Beer className="h-4 w-4" /> Send a Beer
              </Button>
            </div>
          </motion.div>
        )}

        {/* ===== TAB: LEADERBOARD ===== */}
        {activeTab === 'leaderboard' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-amber-500" /> This Homestand's Top Buyers
              </p>
              <span className="text-[10px] text-muted-foreground">Resets each series</span>
            </div>

            {LEADERBOARD_MOCK.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  i === 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-card/60'
                }`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  i === 0 ? 'bg-amber-500 text-amber-950' : i === 1 ? 'bg-muted text-foreground' : i === 2 ? 'bg-orange-800/30 text-orange-400' : 'bg-muted/50 text-muted-foreground'
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{entry.name}</p>
                </div>
                <span className="text-sm">{entry.emoji}</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{entry.rounds}</p>
                  <p className="text-[9px] text-muted-foreground">rounds</p>
                </div>
              </motion.div>
            ))}

            {/* Gamification CTA */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-sm font-bold text-foreground mb-1">
                {user ? 'Climb the ranks! 🏆' : 'Join to compete! 🏆'}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Buy 5 more rounds this homestand to crack the Top 3.
              </p>
              <Button onClick={() => setActiveTab('send')} className="rounded-2xl gap-2 text-sm">
                <Beer className="h-4 w-4" /> Buy a Round
              </Button>
            </div>
          </motion.div>
        )}

        {/* ===== TAB: SEND ===== */}
        {activeTab === 'send' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* ── LIVE SOCIAL PROOF TICKER ── */}
            <div className="overflow-hidden rounded-xl border border-border bg-card/60">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <p className="text-[11px] font-semibold text-foreground">Happening now in Wrigleyville</p>
              </div>
              <div className="divide-y divide-border/30">
                {MOCK_FEED.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2">
                    <span className="text-sm">{a.emoji}</span>
                    <p className="flex-1 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{a.from}</span> bought{' '}
                      <span className="font-semibold text-foreground">{a.to}</span> a beer at{' '}
                      <span className="font-semibold text-foreground">{a.bar}</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── STEP 1: RECIPIENT ── */}
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">Who's getting a beer?</p>
              </div>

              {/* No recipient yet */}
              {!recipientType && (
                <div className="space-y-3">
                  {/* Active fans carousel */}
                  {nearbyFans && nearbyFans.length > 0 && (
                    <div className="rounded-xl border border-border bg-card/60 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">🧊 Fans active nearby</p>
                      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        {(nearbyFans as any[]).map((f) => (
                          <button
                            key={f.user_id}
                            onClick={() => navigate(`/beer-money?to=${f.user_id}`)}
                            className="flex flex-col items-center gap-1 rounded-xl p-2 hover:bg-muted/60 transition-colors shrink-0 w-16"
                          >
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-primary/20">
                              {f.profile_photo ? (
                                <img src={f.profile_photo} alt={f.display_name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
                                  {f.display_name?.charAt(0)}
                                </div>
                              )}
                              {f.location_last_set_at && Date.now() - new Date(f.location_last_set_at).getTime() < 10 * 60_000 && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                              )}
                            </div>
                            <span className="text-[10px] font-medium text-foreground truncate w-full text-center">
                              {f.display_name?.split(' ')[0]}
                            </span>
                            {f.wrigleyville_bar && (
                              <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                                @ {f.wrigleyville_bar.split(' ')[0]}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick nav */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/bar-map"
                      className="flex items-center gap-2.5 rounded-xl border border-border bg-card/60 px-3 py-3 transition hover:border-primary/40 active:scale-[0.97]"
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
                      className="flex items-center gap-2.5 rounded-xl border border-border bg-card/60 px-3 py-3 transition hover:border-primary/40 active:scale-[0.97]"
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

                  {/* Participating venues */}
                  <div className="rounded-xl border border-border bg-card/60 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">🗺️ Participating venues</p>
                    <div className="space-y-1">
                      {PARTICIPATING_BARS.map((bar) => (
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
                  </div>

                  {/* Send to non-user */}
                  {!showNonUserSend ? (
                    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-center">
                      <Gift className="h-5 w-5 text-primary mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-foreground mb-1">Know someone who should be here?</p>
                      <p className="text-[11px] text-muted-foreground mb-3">
                        Buy them a beer — they'll get a link to sign up & claim it at the bar.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5 text-xs"
                        onClick={() => setShowNonUserSend(true)}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Send to a Friend (Not on App)
                      </Button>
                    </div>
                  ) : (
                    <SendToNonUserPanel
                      amount={amount}
                      note={note}
                      onClaimGenerated={(url, name) => {
                        setClaimLinkUrl(url);
                        toast({ title: `Claim link created for ${name}!`, description: 'Share the link so they can redeem their beer 🍺' });
                      }}
                    />
                  )}
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

              {/* Fan recipient */}
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
                        {toUser.location_last_set_at && Date.now() - new Date(toUser.location_last_set_at).getTime() < 10 * 60_000 && (
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
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">21+</span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                              <AlertTriangle className="h-2.5 w-2.5" /> Under 21
                            </span>
                          )}
                          {toUser.wrigleyville_bar && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                              <MapPin className="h-2.5 w-2.5" /> {toUser.wrigleyville_bar}
                            </span>
                          )}
                        </div>
                        {toUser.vibe_state && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {toUser.vibe_emoji} {toUser.vibe_state}
                          </p>
                        )}
                      </div>
                      <button onClick={() => navigate('/beer-money')} className="text-[10px] font-semibold text-primary hover:underline shrink-0">
                        Change
                      </button>
                    </div>
                  </div>
                  {!isAdult && (
                    <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-2.5">
                      <p className="text-[11px] font-semibold text-destructive">🚫 Can't send Beer Money to fans under 21.</p>
                    </div>
                  )}
                  {isAdult && redeemBar && (
                    <div className="border-t border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">📍 Redeemable at</p>
                      <BarLocationPreview bar={redeemBar} />
                    </div>
                  )}
                </div>
              )}

              {/* Meetup recipient */}
              {recipientType === 'meetup' && toMeetup && (
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl">🍻</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{toMeetup.location_name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Live Meetup</span>
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-2.5 w-2.5" /> 21+ venue
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {toMeetup.member_count}/{toMeetup.max_members}</span>
                          {toMeetup.meeting_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(toMeetup.meeting_time).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => navigate('/beer-money')} className="text-[10px] font-semibold text-primary hover:underline shrink-0">Change</button>
                    </div>
                  </div>
                  <div className="border-t border-border/50 bg-muted/30 px-4 py-2">
                    <p className="text-[10px] text-muted-foreground">💡 Split across attendees checked in at the bar.</p>
                  </div>
                  {redeemBar && (
                    <div className="border-t border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">📍 Redeemable at</p>
                      <BarLocationPreview bar={redeemBar} />
                    </div>
                  )}
                </div>
              )}

              {/* Bar recipient */}
              {recipientType === 'bar' && barName && (
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  {participatingBar ? (
                    <>
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xl">🍺</div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-foreground">{barName}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                <Star className="h-2.5 w-2.5" /> Participating
                              </span>
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="h-2.5 w-2.5" /> 21+
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-primary" /> {participatingBar.address}
                            </p>
                          </div>
                          <button onClick={() => navigate('/beer-money')} className="text-[10px] font-semibold text-primary hover:underline shrink-0">Change</button>
                        </div>
                      </div>
                      <div className="border-t border-border p-3">
                        <BarLocationPreview bar={participatingBar} />
                      </div>
                    </>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xl">⚠️</div>
                        <div>
                          <p className="font-semibold text-foreground">{barName}</p>
                          <p className="text-[11px] text-destructive font-medium">Not a participating venue</p>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full rounded-xl text-xs">
                        <Link to="/bar-map">🗺️ Pick from the Beer Map</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── STEP 2: AMOUNT ── */}
            {hasRecipient && !isFanRecipientInvalid && !isBarRecipientInvalid && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground">Pick your round</p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {AMOUNTS.map((a) => (
                    <motion.button
                      key={a.value}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAmount(a.value)}
                      className={`relative flex flex-col items-center gap-0.5 rounded-xl border py-3 transition-all ${
                        amount === a.value
                          ? 'border-primary bg-primary/10 shadow-sm shadow-primary/10'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      {a.tag && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 py-0.5 text-[7px] font-bold text-primary-foreground whitespace-nowrap">
                          {a.tag}
                        </span>
                      )}
                      <span className="text-lg">{a.emoji}</span>
                      <span className={`text-sm font-bold ${amount === a.value ? 'text-primary' : 'text-foreground'}`}>{a.label}</span>
                      <span className="text-[9px] text-muted-foreground">{a.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            )}

            {/* ── STEP 3: MESSAGE ── */}
            {hasRecipient && !isFanRecipientInvalid && !isBarRecipientInvalid && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Add a message <span className="font-normal normal-case text-muted-foreground">(optional)</span>
                  </p>
                </div>
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
                    >{msg}</button>
                  ))}
                </div>
                <Textarea
                  placeholder="Or type your own message…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="rounded-xl min-h-[60px]"
                  maxLength={140}
                />
                <p className="text-[10px] text-muted-foreground text-right mt-1">{note.length}/140</p>
              </motion.section>
            )}

            {/* ── TRUST & SHARE ── */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-[11px] font-semibold text-foreground mb-0.5">21+ Verified</p>
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    Redeemable only at verified Wrigleyville venues. No alcohol delivered through the app.
                  </p>
                </div>
              </div>
              <button
                onClick={handleShare}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card/60 px-4 hover:border-primary/30 transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4 text-muted-foreground" />}
                <span className="text-[9px] font-medium text-muted-foreground">{copied ? 'Copied' : 'Share'}</span>
              </button>
            </div>

            {/* ── CTA ── */}
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!canSend}
              className="w-full rounded-2xl py-6 text-base font-semibold gap-2 shadow-lg shadow-primary/20"
            >
              <Beer className="h-5 w-5" />
              {contextualCTA}
              {canSend && <span className="ml-1 opacity-80">· ${amount}</span>}
            </Button>

            {/* ── CREDITS UPSELL ── */}
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🎟️</span>
                <p className="text-xs font-bold text-foreground">Beer Money Credits</p>
                <span className="ml-auto text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Save up to 20%</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">Pre-load → skip checkout every time.</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { credits: 25, price: 25, bonus: '' },
                  { credits: 55, price: 50, bonus: '+$5 free' },
                  { credits: 120, price: 100, bonus: '+$20 free', best: true },
                ].map((pkg) => (
                  <button
                    key={pkg.price}
                    onClick={() => toast({ title: 'Coming soon!', description: 'Credit packs launching next homestand 🏟️' })}
                    className={`relative rounded-xl border p-2.5 text-center hover:border-primary/40 transition-colors ${
                      pkg.best ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
                    }`}
                  >
                    {pkg.best && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[7px] font-bold text-primary-foreground">Best Value</span>
                    )}
                    <p className="text-base font-bold text-primary">${pkg.credits}</p>
                    <p className="text-[10px] text-muted-foreground">for ${pkg.price}</p>
                    {pkg.bonus && <p className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">{pkg.bonus}</p>}
                  </button>
                ))}
              </div>
            </div>

            {/* ── REFERRAL CTA ── */}
            <div className="rounded-xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-amber-500/5 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-primary" />
                <p className="text-xs font-bold text-foreground">Invite & Earn 🍺</p>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                For every friend who joins and buys their first round, you both get <span className="font-bold text-primary">$5 free credits</span>.
              </p>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={handleShare}>
                <Share2 className="h-3.5 w-3.5" />
                {copied ? 'Link Copied!' : 'Share Your Invite'}
              </Button>
            </div>
          </motion.div>
        )}
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
                <p className="text-4xl mb-2">🍻</p>
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

              <div className="flex items-start gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5 mb-4">
                <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                <p className="text-[10px] text-muted-foreground">
                  You confirm you're 21+ and the recipient is at a participating venue.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button className="flex-1 rounded-xl gap-1 font-semibold" onClick={handleSend}>
                  <Beer className="h-4 w-4" /> Send 🍺
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DynamicBackground>
  );
}
