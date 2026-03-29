import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GameStatus, PrivacyLevel, WRIGLEYVILLE_BARS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Users, Radio, Eye, EyeOff, Lock, Zap } from 'lucide-react';
import { HappeningNow } from '@/components/HappeningNow';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { GamePhaseTimeline } from '@/components/GamePhaseTimeline';
import { GameDayMap } from '@/components/GameDayMap';
import { CrowdEnergyMap } from '@/components/CrowdEnergyMap';
import { InstantMatchPanel } from '@/components/InstantMatchPanel';
import { SmartMeetupSuggestions } from '@/components/SmartMeetupSuggestions';
import { SquadMatcherPanel } from '@/components/SquadMatcherPanel';
import { SocialProofBanner } from '@/components/SocialProofBanner';
import { PostGameExperience } from '@/components/PostGameExperience';
import { LiveScoringBanner } from '@/components/scoring/LiveScoringBanner';
import { SafetyTimerBanner } from '@/components/SafetyTimerBanner';

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

// Wrigley Field sections for the stadium map
const STADIUM_SECTIONS = [
  // Lower deck - behind home plate
  { id: '101', x: 45, y: 82, zone: 'lower' }, { id: '102', x: 40, y: 80, zone: 'lower' },
  { id: '103', x: 35, y: 77, zone: 'lower' }, { id: '104', x: 30, y: 73, zone: 'lower' },
  { id: '105', x: 26, y: 68, zone: 'lower' }, { id: '106', x: 22, y: 63, zone: 'lower' },
  { id: '107', x: 19, y: 57, zone: 'lower' }, { id: '108', x: 17, y: 51, zone: 'lower' },
  { id: '109', x: 16, y: 45, zone: 'lower' }, { id: '110', x: 50, y: 83, zone: 'lower' },
  { id: '111', x: 55, y: 82, zone: 'lower' }, { id: '112', x: 60, y: 80, zone: 'lower' },
  { id: '113', x: 65, y: 77, zone: 'lower' }, { id: '114', x: 70, y: 73, zone: 'lower' },
  { id: '115', x: 74, y: 68, zone: 'lower' }, { id: '116', x: 78, y: 63, zone: 'lower' },
  { id: '117', x: 81, y: 57, zone: 'lower' }, { id: '118', x: 83, y: 51, zone: 'lower' },
  { id: '119', x: 84, y: 45, zone: 'lower' },
  // Upper deck
  { id: '201', x: 45, y: 90, zone: 'upper' }, { id: '202', x: 40, y: 88, zone: 'upper' },
  { id: '203', x: 35, y: 85, zone: 'upper' }, { id: '204', x: 30, y: 81, zone: 'upper' },
  { id: '205', x: 26, y: 76, zone: 'upper' }, { id: '210', x: 50, y: 91, zone: 'upper' },
  { id: '211', x: 55, y: 90, zone: 'upper' }, { id: '212', x: 60, y: 88, zone: 'upper' },
  { id: '213', x: 65, y: 85, zone: 'upper' }, { id: '214', x: 70, y: 81, zone: 'upper' },
  { id: '215', x: 74, y: 76, zone: 'upper' },
  // Bleachers
  { id: '301', x: 30, y: 30, zone: 'bleachers' }, { id: '302', x: 38, y: 25, zone: 'bleachers' },
  { id: '303', x: 46, y: 22, zone: 'bleachers' }, { id: '304', x: 54, y: 22, zone: 'bleachers' },
  { id: '305', x: 62, y: 25, zone: 'bleachers' }, { id: '306', x: 70, y: 30, zone: 'bleachers' },
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

  const { data: fanCounts } = useQuery({
    queryKey: ['fan-counts'],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: atWrigley } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('game_status', 'AtWrigley').gte('location_last_set_at', sixHoursAgo);
      const { data: atBars } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('game_status', 'AtBar').gte('location_last_set_at', sixHoursAgo);
      const { data: barProfiles } = await supabase.from('profiles').select('wrigleyville_bar').eq('game_status', 'AtBar').gte('location_last_set_at', sixHoursAgo).not('wrigleyville_bar', 'is', null);
      const barCounts: Record<string, number> = {};
      barProfiles?.forEach(p => { const b = p.wrigleyville_bar as string; barCounts[b] = (barCounts[b] || 0) + 1; });
      return { wrigley: atWrigley?.length ?? 0, bars: atBars?.length ?? 0, barBreakdown: barCounts };
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  // Fetch fans at Wrigley with sections for the live map
  const { data: wrigleyFans = [] } = useQuery({
    queryKey: ['wrigley-live-fans'],
    queryFn: async () => {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo, wrigley_section, wrigley_location_privacy')
        .eq('game_status', 'AtWrigley')
        .eq('is_banned', false)
        .gte('location_last_set_at', sixHoursAgo)
        .not('wrigley_section', 'is', null);
      return data ?? [];
    },
    refetchInterval: 30000,
    enabled: !!user && status === 'AtWrigley',
  });

  const { data: nearbyFans } = useQuery({
    queryKey: ['nearby-fans', status],
    queryFn: async () => {
      if (status === 'NotSet' || !user) return [];
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, profile_photo, game_status, wrigley_section, wrigleyville_bar, wrigley_location_privacy, bar_location_privacy')
        .eq('game_status', status)
        .eq('is_banned', false)
        .gte('location_last_set_at', sixHoursAgo)
        .neq('user_id', user.id)
        .limit(12);
      return data ?? [];
    },
    enabled: !!user && status !== 'NotSet',
    refetchInterval: 30000,
  });

  // Build section → fan count map for live map
  const sectionFanMap = useMemo(() => {
    const map: Record<string, number> = {};
    wrigleyFans.forEach(f => {
      if (f.wrigley_section && f.wrigley_location_privacy === 'Public') {
        map[f.wrigley_section] = (map[f.wrigley_section] || 0) + 1;
      }
    });
    return map;
  }, [wrigleyFans]);

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
    if (status === 'NotSet') updates.location_last_set_at = null;

    updateProfile.mutate(updates, {
      onSuccess: () => {
        toast({ title: '✅ You\'re checked in!', description: `Status: ${statusOptions.find((s) => s.value === status)?.label ?? 'Not set'}` });
      },
    });
  };

  const totalFansLive = (fanCounts?.wrigley ?? 0) + (fanCounts?.bars ?? 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      {/* Live pulse banner */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="mx-auto max-w-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-sm font-semibold text-foreground">{totalFansLive} fans live now</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>🏟️ {fanCounts?.wrigley ?? 0}</span>
            <span>🍻 {fanCounts?.bars ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-6">
        {/* Safety Timer Banner */}
        <SafetyTimerBanner />

        {/* Social Proof */}
        <div className="mb-4">
          <SocialProofBanner />
        </div>

        {/* Post-Game Experience */}
        <div className="mb-6">
          <PostGameExperience />
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Game Day Hub</h2>
          </div>
          <p className="text-sm text-muted-foreground">Check in and find fans around you</p>
        </div>

        {/* Game Phase Timeline */}
        <div className="mb-6">
          <GamePhaseTimeline />
        </div>

        {/* Happening Now */}
        <div className="mb-6">
          <HappeningNow />
        </div>

        {/* AI Squad Matcher */}
        <div className="mb-6">
          <SquadMatcherPanel />
        </div>

        {/* AI Meetup Suggestions */}
        <div className="mb-6">
          <SmartMeetupSuggestions />
        </div>

        {/* Live Scoring */}
        <div className="mb-6">
          <LiveScoringBanner />
        </div>

        {/* Status toggle */}
        <div className="space-y-2 mb-6">
          {statusOptions.map((opt) => {
            const isActive = status === opt.value;
            return (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStatus(opt.value)}
                className={`w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-border bg-card hover:border-primary/30 hover:shadow-sm'
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-colors ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                  {opt.emoji}
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-foreground">{opt.label}</span>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                {isActive && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs">✓</span>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Conditional fields */}
        <AnimatePresence mode="wait">
          {status === 'AtWrigley' && (
            <motion.div key="wrigley" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6 mb-6">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Your Seat Details</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Section</Label><Input placeholder="e.g. 228" value={section} onChange={(e) => setSection(e.target.value)} className="rounded-xl" /></div>
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Row</Label><Input placeholder="e.g. 5" value={row} onChange={(e) => setRow(e.target.value)} className="rounded-xl" /></div>
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Seat</Label><Input placeholder="e.g. 12" value={seat} onChange={(e) => setSeat(e.target.value)} className="rounded-xl" /></div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Visibility</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {privacyOptions.map((p) => {
                      const PIcon = p.icon;
                      return (
                        <button key={p.value} onClick={() => setLocationPrivacy(p.value)} className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${locationPrivacy === p.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/30'}`}>
                          <PIcon className="h-3.5 w-3.5" />{p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Wrigley Live Mode - Stadium Map */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="font-semibold text-sm">Wrigley Live Mode</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{fanCounts?.wrigley ?? 0} fans checked in</span>
                </div>

                {/* Stadium map */}
                <div className="relative w-full aspect-[4/3] rounded-xl bg-muted/30 border border-border overflow-hidden">
                  {/* Field */}
                  <div className="absolute" style={{ left: '25%', top: '30%', width: '50%', height: '45%' }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Diamond shape for the field */}
                      <polygon points="50,10 90,50 50,90 10,50" fill="hsl(var(--accent)/0.15)" stroke="hsl(var(--accent)/0.3)" strokeWidth="1" />
                      {/* Infield diamond */}
                      <polygon points="50,30 65,50 50,70 35,50" fill="hsl(var(--accent)/0.25)" stroke="hsl(var(--accent)/0.4)" strokeWidth="0.8" />
                    </svg>
                  </div>

                  {/* Section dots */}
                  {STADIUM_SECTIONS.map((sec) => {
                    const count = sectionFanMap[sec.id] ?? 0;
                    const isMySection = section === sec.id;
                    return (
                      <motion.div
                        key={sec.id}
                        className="absolute flex items-center justify-center"
                        style={{ left: `${sec.x}%`, top: `${sec.y}%`, transform: 'translate(-50%, -50%)' }}
                        whileHover={{ scale: 1.3 }}
                      >
                        <div
                          className={`rounded-full flex items-center justify-center text-[8px] font-bold transition-all cursor-default ${
                            isMySection
                              ? 'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30 h-7 w-7'
                              : count > 0
                                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 h-6 w-6'
                                : 'bg-muted text-muted-foreground h-4 w-4'
                          }`}
                          title={`Section ${sec.id}${count > 0 ? ` • ${count} fan${count > 1 ? 's' : ''}` : ''}`}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Labels */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bleachers</div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Home Plate</div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Fans here</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-secondary" /> Your section</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-muted" /> Empty</span>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'AtBar' && (
            <motion.div key="bar" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="rounded-2xl border border-border bg-card p-5 mb-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Pick Your Bar</span></div>
              <div className="space-y-1.5">
                {WRIGLEYVILLE_BARS.map((b) => {
                  const count = fanCounts?.barBreakdown?.[b.name] ?? 0;
                  return (
                    <button key={b.id} onClick={() => setBar(b.name)} className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${bar === b.name ? 'border-primary bg-primary/5 font-semibold text-foreground' : 'border-border bg-background text-foreground hover:border-primary/30'}`}>
                      <span>{b.name}</span>
                      {count > 0 && <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">{count} fan{count !== 1 ? 's' : ''}</span>}
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
                      <button key={p.value} onClick={() => setLocationPrivacy(p.value)} className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${locationPrivacy === p.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/30'}`}>
                        <PIcon className="h-3.5 w-3.5" />{p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button onClick={save} disabled={updateProfile.isPending} className="w-full rounded-2xl py-6 text-base font-semibold">
          {updateProfile.isPending ? 'Saving...' : status === 'NotSet' ? 'Clear Status' : '⚡ Check In Now'}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">Auto-expires after 6 hours</p>

        {/* Live Interactive Map */}
        <div className="mt-8">
          <GameDayMap />
        </div>

        {/* Fans Near You */}
        {status !== 'NotSet' && nearbyFans && nearbyFans.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <h3 className="font-bold text-foreground">Fans Near You Right Now</h3>
              <span className="text-xs text-muted-foreground ml-auto">{nearbyFans.length} active</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {nearbyFans.slice(0, 8).map((fan) => (
                <motion.div key={fan.id} whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-primary/20 bg-muted ring-2 ring-background">
                      {fan.profile_photo ? (
                        <img src={fan.profile_photo} alt={fan.display_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">{fan.display_name?.charAt(0) ?? '?'}</div>
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
                  </div>
                  <span className="text-[11px] font-medium text-foreground text-center truncate w-full">{fan.display_name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
