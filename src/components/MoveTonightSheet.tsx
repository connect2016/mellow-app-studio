import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Search, Camera, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { WRIGLEYVILLE_BARS } from '@/types';
import { useBarCheckins } from '@/hooks/useBarCheckins';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateMeetup } from '@/contexts/CreateMeetupContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const NAVY = 'hsl(var(--brand-navy))';
const RED = 'hsl(var(--brand-red))';

type View = 'menu' | 'checkin';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveTonightSheet({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { open: openMeetup } = useCreateMeetup();
  const { checkIn } = useBarCheckins();
  const [view, setView] = useState<View>('menu');
  const [search, setSearch] = useState('');
  const [selectedBar, setSelectedBar] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBars = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return WRIGLEYVILLE_BARS;
    return WRIGLEYVILLE_BARS.filter(
      (b) => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q),
    );
  }, [search]);

  const reset = () => {
    setView('menu');
    setSearch('');
    setSelectedBar('');
    setSubmitting(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) setTimeout(reset, 200);
    onOpenChange(next);
  };

  const captureCoords = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve) => {
      if (!('geolocation' in navigator)) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 4000, maximumAge: 60000 },
      );
    });

  const handleConfirmCheckIn = async () => {
    if (!selectedBar) return;
    setSubmitting(true);
    haptic('medium');
    try {
      const coords = await captureCoords();
      // Reuse hook's RLS-safe upsert path, then patch coords.
      await checkIn.mutateAsync({ barName: selectedBar, visibility: 'visible' });
      if (coords && user) {
        await supabase
          .from('bar_checkins')
          .update({ lat: coords.lat, lng: coords.lng })
          .eq('user_id', user.id)
          .eq('bar_name', selectedBar)
          .gt('expires_at', new Date().toISOString());
      }
      // Replace the hook's default toast with the on-brand confirmation.
      toast.dismiss();
      toast.success(`You're checked in at ${selectedBar}! 🍺`, {
        description: 'Your crew can see you now.',
        duration: 4500,
      });
      handleClose(false);
    } catch (e) {
      toast.error('Could not check you in — try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartMeetup = () => {
    haptic('selection');
    onOpenChange(false);
    setTimeout(() => openMeetup(), 180);
  };

  const handleFindBuddy = () => {
    haptic('selection');
    onOpenChange(false);
    setTimeout(() => navigate('/discover-fans'), 120);
  };

  const handleShareMoment = () => {
    haptic('selection');
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    setPosting(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('vibe-media').upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('vibe-media').getPublicUrl(path);
      const { error } = await supabase.from('vibe_posts').insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: file.type.startsWith('video/') ? 'video' : 'image',
        location_tag: 'Wrigleyville',
      });
      if (error) throw error;
      toast.success('Posted to Live From Wrigleyville! 📸');
      onOpenChange(false);
      setTimeout(() => navigate('/vibe'), 200);
    } catch (err) {
      console.error(err);
      toast.error('Could not post your moment — try again');
    } finally {
      setPosting(false);
    }
  };

  const options = [
    { key: 'checkin', emoji: '📍', title: 'Check In at a Bar', sub: 'Let your crew know where', onClick: () => { haptic('selection'); setView('checkin'); } },
    { key: 'meetup', emoji: '👥', title: 'Start a Meetup', sub: 'Plan it in 30 seconds', onClick: handleStartMeetup },
    { key: 'buddy', emoji: '🔍', title: 'Find a Buddy', sub: 'Match with fans nearby', onClick: handleFindBuddy },
    { key: 'moment', emoji: '📸', title: 'Share a Moment', sub: 'Snap & post to the feed', onClick: handleShareMoment },
  ];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-0 p-0 max-h-[88vh] overflow-hidden"
          style={{ background: NAVY }}
        >
          {/* Drag handle */}
          <div className="pt-3 pb-1 flex justify-center">
            <div className="h-1.5 w-12 rounded-full bg-white/30" />
          </div>

          {view === 'menu' && (
            <div className="px-5 pb-8">
              <SheetHeader className="text-center mb-5">
                <SheetTitle
                  className="text-white text-2xl"
                  style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.03em' }}
                >
                  What's Your Move Tonight? 🎯
                </SheetTitle>
                <SheetDescription className="text-white/70 text-sm">
                  Pick how you want to roll into game day
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-3">
                {options.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={opt.onClick}
                    disabled={posting && opt.key === 'moment'}
                    className={cn(
                      'group relative flex flex-col items-start gap-2 rounded-2xl p-4 min-h-[140px] text-left',
                      'bg-[hsl(222,82%,22%)] ring-1 ring-white/10',
                      'active:scale-[0.97] transition-transform',
                      'shadow-[0_4px_14px_rgba(0,0,0,0.25)]',
                    )}
                  >
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: RED, boxShadow: '0 4px 10px rgba(200,16,46,0.35)' }}
                    >
                      {posting && opt.key === 'moment' ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      ) : (
                        <span>{opt.emoji}</span>
                      )}
                    </div>
                    <div className="mt-1">
                      <div
                        className="text-white text-[15px] leading-tight font-bold"
                        style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.02em' }}
                      >
                        {opt.title}
                      </div>
                      <div className="text-white/65 text-[11px] mt-1 leading-snug">
                        {opt.sub}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === 'checkin' && (
            <div className="px-5 pb-6 flex flex-col" style={{ maxHeight: 'calc(88vh - 16px)' }}>
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setView('menu')}
                  className="h-9 w-9 rounded-full flex items-center justify-center bg-white/10 active:scale-95 transition-transform"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4 text-white" />
                </button>
                <div className="flex-1">
                  <div
                    className="text-white text-lg leading-tight"
                    style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.03em' }}
                  >
                    Check In at a Bar 📍
                  </div>
                  <div className="text-white/60 text-xs">Pick your spot in Wrigleyville</div>
                </div>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search bars…"
                  className="pl-9 bg-white/10 border-white/15 text-white placeholder:text-white/45 focus-visible:ring-white/30"
                />
              </div>

              <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1.5 max-h-[42vh]">
                {filteredBars.length === 0 && (
                  <div className="text-center text-white/60 text-sm py-8">
                    No bars match "{search}"
                  </div>
                )}
                {filteredBars.map((bar) => {
                  const active = selectedBar === bar.name;
                  return (
                    <button
                      key={bar.id}
                      type="button"
                      onClick={() => { haptic('selection'); setSelectedBar(bar.name); }}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors min-h-[56px]',
                        active ? 'bg-[hsl(var(--brand-red))]/95 ring-2 ring-white/30' : 'bg-white/[0.06] hover:bg-white/[0.1]',
                      )}
                    >
                      <MapPin className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-white/60')} />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{bar.name}</div>
                        <div className="text-white/55 text-[11px] truncate">{bar.address}</div>
                      </div>
                      {active && <Check className="h-4 w-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={handleConfirmCheckIn}
                disabled={!selectedBar || submitting}
                className="mt-4 w-full h-12 rounded-xl text-base font-bold text-white border-0"
                style={{ background: RED, fontFamily: 'Norwester, sans-serif', letterSpacing: '0.04em' }}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Checking In…</>
                ) : selectedBar ? (
                  `Check In at ${selectedBar}`
                ) : (
                  'Pick a bar to continue'
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
