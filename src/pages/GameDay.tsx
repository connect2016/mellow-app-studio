import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GameStatus, PrivacyLevel, WRIGLEYVILLE_BARS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

const statusOptions: { value: GameStatus; label: string; emoji: string }[] = [
  { value: 'AtWrigley', label: 'At Wrigley Field', emoji: '🏟️' },
  { value: 'AtBar', label: 'At a Wrigleyville Bar', emoji: '🍻' },
  { value: 'WatchingRemote', label: 'Watching From Elsewhere', emoji: '📺' },
  { value: 'NotSet', label: 'Not Watching', emoji: '😴' },
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

  // Hydrate from profile
  useEffect(() => {
    if (!profile) return;
    setStatus((profile.game_status as GameStatus) ?? 'NotSet');
    setSection(profile.wrigley_section ?? '');
    setRow(profile.wrigley_row ?? '');
    setSeat(profile.wrigley_seat ?? '');
    setBar(profile.wrigleyville_bar ?? '');
    setLocationPrivacy((profile.wrigley_location_privacy as PrivacyLevel) ?? 'MatchesOnly');
  }, [profile]);

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
          title: '✅ Game-day status updated!',
          description: `You're ${statusOptions.find((s) => s.value === status)?.label.toLowerCase()}`,
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-4">
        <h2 className="mb-1 text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>Game Day</h2>
        <p className="mb-6 text-sm text-muted-foreground">Let fans know where you're watching today</p>

        {/* Status picker */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {statusOptions.map((opt) => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStatus(opt.value)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-4 transition-all ${
                status === opt.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-xs font-medium">{opt.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Conditional fields */}
        {status === 'AtWrigley' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 mb-6">
            <Label>Your seat (optional)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Section" value={section} onChange={(e) => setSection(e.target.value)} />
              <Input placeholder="Row" value={row} onChange={(e) => setRow(e.target.value)} />
              <Input placeholder="Seat" value={seat} onChange={(e) => setSeat(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Who can see this?</Label>
              <Select value={locationPrivacy} onValueChange={(v) => setLocationPrivacy(v as PrivacyLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Everyone</SelectItem>
                  <SelectItem value="MatchesOnly">Matches Only</SelectItem>
                  <SelectItem value="Hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}

        {status === 'AtBar' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 mb-6">
            <Label>Which bar?</Label>
            <Select value={bar} onValueChange={setBar}>
              <SelectTrigger><SelectValue placeholder="Select a bar" /></SelectTrigger>
              <SelectContent>
                {WRIGLEYVILLE_BARS.map((b) => (
                  <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <Label className="text-xs text-muted-foreground">Who can see this?</Label>
              <Select value={locationPrivacy} onValueChange={(v) => setLocationPrivacy(v as PrivacyLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Everyone</SelectItem>
                  <SelectItem value="MatchesOnly">Matches Only</SelectItem>
                  <SelectItem value="Hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}

        <Button
          onClick={save}
          disabled={updateProfile.isPending}
          className="w-full rounded-xl py-6 text-base font-semibold"
        >
          {updateProfile.isPending ? 'Saving...' : 'Save Status'}
        </Button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Your status will auto-expire after 6 hours
        </p>
      </div>
    </div>
  );
}
