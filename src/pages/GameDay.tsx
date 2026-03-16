import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GameStatus, PrivacyLevel, WRIGLEYVILLE_BARS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Users, Radio, Eye, EyeOff, Lock, Zap } from 'lucide-react';

const statusOptions: { value: GameStatus; label: string; emoji: string; icon: typeof MapPin; desc: string }[] = [
  { value: 'AtWrigley', label: 'At Wrigley', emoji: '🏟️', icon: MapPin, desc: 'I\'m at the ballpark' },
  { value: 'AtBar', label: 'At a Bar', emoji: '🍻', icon: Users, desc: 'Watching at a Wrigleyville bar' },
  { value: 'WatchingRemote', label: 'Watching From Home', emoji: '📺', icon: Radio, desc: 'Tuned in from elsewhere' },
];

const privacyOptions: { value: PrivacyLevel; label: string; icon: typeof Eye }[] = [
  { value: 'Public', label: 'Everyone', icon: Eye },
  { value: 'MatchesOnly', label: 'Matches Only', icon: Lock },
  { value: 'Hidden', label: 'Hidden', icon: EyeOff },
];

export default function GameDay() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [status, setStatus] = useState<GameStatus>('NotSet');
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [seat, setSeat] = useState('');
  const [bar, setBar] = useState('');
  const [locationPrivacy, setLocationPrivacy] = useState<PrivacyLevel>('MatchesOnly');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!profile) return;
    setStatus((profile.game_status as GameStatus) ?? 'NotSet');
    setSection(profile.wrigley_section ?? '');
    setRow(profile.wrigley_row ?? '');
    setSeat(profile.wrigley_seat ?? '');
    setBar(profile.wrigleyville_bar ?? '');
    setLocationPrivacy((profile.wrigley_location_privacy as PrivacyLevel) ?? 'MatchesOnly');
  }, [profile]);

  // Fetch live fan counts
  const { data: fanCounts } = useQuery({
    queryKey: ['fan-counts'],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      const { data: atWrigley } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('game_status', 'AtWrigley')
        .gte('location_last_set_at', sixHoursAgo);

      const { data: atBars } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('game_status', 'AtBar')
        .gte('location_last_set_at', sixHoursAgo);

      // Get per-bar counts
      const { data: barProfiles } = await supabase
        .from('profiles')
        .select('wrigleyville_bar')
        .eq('game_status', 'AtBar')
        .gte('location_last_set_at', sixHoursAgo)
        .not('wrigleyville_bar', 'is', null);

      const barCounts: Record<string, number> = {};
      barProfiles?.forEach(p => {
        const b = p.wrigleyville_bar as string;
        barCounts[b] = (barCounts[b] || 0) + 1;
      });

      return {
        wrigley: atWrigley?.length ?? 0,
        bars: atBars?.length ?? 0,
        barBreakdown: barCounts,
      };
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  // Fetch nearby fans (same status)
  const { data: nearbyFans } = useQuery({
    queryKey: ['nearby-fans', status],
    queryFn: async () => {
      if (status === 'NotSet' || !user) return [];
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from('profiles')
        .select('id, display_name, profile_photo, game_status, wrigley_section, wrigleyville_bar, wrigley_location_privacy, bar_location_privacy')
        .eq('game_status', status)
        .eq('is_banned', false)
        .gte('location_last_set_at', sixHoursAgo)
        .neq('user_id', user.id)
        .limit(12);

      const { data } = await query;
      return data ?? [];
    },
    enabled: !!user && status !== 'NotSet',
    refetchInterval: 30000,
  });

  const save = () => {
    const updates: Record<string, unknown> = {
      game_status: status,
      location_last_set_at: new Date().toISOString(),
    };

    if (status === 'AtWrigley') {
      updates.wrigley_section = section || null;
      updates.wrigley_row = row || null;
      updates.wrigley_seat = seat || null;
      updates.wrigley_location_privacy = locationPrivacy;
    } else if (status === 'AtBar') {
      updates.wrigleyville_bar = bar || null;
      updates.bar_location_privacy = locationPrivacy;
    }

    if (status === 'NotSet') {
      updates.location_last_set_at = null;
    }

    updateProfile.mutate(updates, {
      onSuccess: () => {
        toast({
          title: '✅ You\'re checked in!',
          description: `Status: ${statusOptions.find((s) => s.value === status)?.label ?? 'Not set'}`,
        });
      },
    });
  };

  const totalFansLive = (fanCounts?.wrigley ?? 0) + (fanCounts?.bars ?? 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      {/* Live pulse banner */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="mx-auto max-w-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-sm font-semibold text-foreground">
              {totalFansLive} fans live right now
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>🏟️ {fanCounts?.wrigley ?? 0} at Wrigley</span>
            <span>🍻 {fanCounts?.bars ?? 0} at bars</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Game Day Hub</h2>
          </div>
          <p className="text-sm text-muted-foreground">Check in and find fans around you</p>
        </div>

        {/* Status toggle cards */}
        <div className="space-y-2 mb-6">
          {statusOptions.map((opt) => {
            const isActive = status === opt.value;
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStatus(opt.value)}
                className={`w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                  isActive ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  {opt.emoji}
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-foreground">{opt.label}</span>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                  >
                    <span className="text-primary-foreground text-xs">✓</span>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Conditional detail sections */}
        <AnimatePresence mode="wait">
          {status === 'AtWrigley' && (
            <motion.div
              key="wrigley"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-border bg-card p-5 mb-6 space-y-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Your Seat Details</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Section</Label>
                  <Input placeholder="e.g. 228" value={section} onChange={(e) => setSection(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Row</Label>
                  <Input placeholder="e.g. 5" value={row} onChange={(e) => setRow(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Seat</Label>
                  <Input placeholder="e.g. 12" value={seat} onChange={(e) => setSeat(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Visibility</Label>
                <div className="grid grid-cols-3 gap-2">
                  {privacyOptions.map((p) => {
                    const PIcon = p.icon;
                    return (
                      <button
                        key={p.value}
                        onClick={() => setLocationPrivacy(p.value)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                          locationPrivacy === p.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        <PIcon className="h-3.5 w-3.5" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {status === 'AtBar' && (
            <motion.div
              key="bar"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-border bg-card p-5 mb-6 space-y-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Pick Your Bar</span>
              </div>
              <div className="space-y-1.5">
                {WRIGLEYVILLE_BARS.map((b) => {
                  const count = fanCounts?.barBreakdown?.[b.name] ?? 0;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setBar(b.name)}
                      className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                        bar === b.name
                          ? 'border-primary bg-primary/5 font-semibold text-foreground'
                          : 'border-border bg-background text-foreground hover:border-primary/30'
                      }`}
                    >
                      <span>{b.name}</span>
                      {count > 0 && (
                        <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                          {count} {count === 1 ? 'fan' : 'fans'} here
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Visibility</Label>
                <div className="grid grid-cols-3 gap-2">
                  {privacyOptions.map((p) => {
                    const PIcon = p.icon;
                    return (
                      <button
                        key={p.value}
                        onClick={() => setLocationPrivacy(p.value)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                          locationPrivacy === p.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        <PIcon className="h-3.5 w-3.5" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save button */}
        <Button
          onClick={save}
          disabled={updateProfile.isPending}
          className="w-full rounded-2xl py-6 text-base font-semibold"
        >
          {updateProfile.isPending ? 'Saving...' : status === 'NotSet' ? 'Clear Status' : '⚡ Check In Now'}
        </Button>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Auto-expires after 6 hours
        </p>

        {/* Fans Near You section */}
        {status !== 'NotSet' && nearbyFans && nearbyFans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <h3 className="font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
                Fans Near You Right Now
              </h3>
              <span className="text-xs text-muted-foreground ml-auto">{nearbyFans.length} active</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {nearbyFans.slice(0, 8).map((fan) => (
                <motion.div
                  key={fan.id}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-primary/30 bg-muted">
                      {fan.profile_photo ? (
                        <img src={fan.profile_photo} alt={fan.display_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                          {fan.display_name?.charAt(0) ?? '?'}
                        </div>
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
                  </div>
                  <span className="text-[11px] font-medium text-foreground text-center truncate w-full">
                    {fan.display_name}
                  </span>
                  {fan.game_status === 'AtWrigley' && fan.wrigley_section && fan.wrigley_location_privacy === 'Public' && (
                    <span className="text-[10px] text-muted-foreground">Sec {fan.wrigley_section}</span>
                  )}
                  {fan.game_status === 'AtBar' && fan.wrigleyville_bar && fan.bar_location_privacy === 'Public' && (
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">{fan.wrigleyville_bar}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
