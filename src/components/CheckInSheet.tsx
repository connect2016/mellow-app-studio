import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useMlbCubsGame } from '@/hooks/useMlbCubsGame';
import { toast } from 'sonner';
import { MapPin, Beer, Hash, X, Building2, MessageCircle } from 'lucide-react';
import { RooftopPicker } from '@/components/rooftops/RooftopPicker';

const BAR_CHIPS = [
  "Murphy's Bleachers",
  'Cubby Bear',
  'Sluggers',
  'Wrigleyville Bar',
  "Bernie's Tap",
  'Nisei Lounge',
];

// Short first-pass list, not comprehensive.
const BLOCKED_WORDS = ['fuck', 'shit', 'bitch', 'cunt', 'asshole', 'nigger', 'fag', 'faggot', 'whore', 'slut'];

function containsBlockedWord(text: string): boolean {
  const words = text.toLowerCase().split(/[^a-z0-9]+/);
  return BLOCKED_WORDS.some((w) => words.includes(w));
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CheckInSheet({ open, onClose }: Props) {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const { data: game } = useMlbCubsGame();

  const [otherOpen, setOtherOpen] = useState(false);
  const [otherBar, setOtherBar] = useState('');
  const [sectionInput, setSectionInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  // Detect home game in active window (live, or final within last 3h)
  const isHomeGame = game?.homeAway === 'home';
  const isHomeGameActive = isHomeGame && (
    game?.status === 'live' ||
    game?.status === 'pre-game' ||
    (game?.status === 'final' && game?.gameDate &&
      Date.now() - new Date(game.gameDate).getTime() < 3 * 60 * 60 * 1000)
  );

  const currentBar = (profile as any)?.checkin_bar as string | null;
  const currentRooftop = (profile as any)?.checkin_rooftop as string | null;
  const currentSection = (profile as any)?.checkin_section as string | null;
  const currentNote = (profile as any)?.checkin_status_note as string | null;
  const expiresAt = (profile as any)?.checkin_expires_at as string | null;
  const isSectionExpired = !expiresAt || new Date(expiresAt) < new Date();
  const liveSection = isSectionExpired ? null : currentSection;
  const liveNote = isSectionExpired ? null : currentNote;

  useEffect(() => {
    setSectionInput(liveSection ?? '');
    setNoteInput(liveNote ?? '');
    if (currentBar && !BAR_CHIPS.includes(currentBar)) {
      setOtherBar(currentBar);
      setOtherOpen(true);
    }
  }, [open]); // eslint-disable-line

  const setBar = async (bar: string | null) => {
    await update.mutateAsync({
      checkin_bar: bar,
      checkin_updated_at: new Date().toISOString(),
    });
    if (bar) toast.success(`Checked in at ${bar}`);
  };

  const saveSection = async () => {
    const trimmed = sectionInput.trim().slice(0, 20);
    if (!trimmed) return;
    const expires = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    await update.mutateAsync({
      checkin_section: trimmed,
      checkin_expires_at: expires,
      checkin_updated_at: new Date().toISOString(),
    });
    toast.success(`Section ${trimmed} — visible for 3h`);
  };

  const clearSection = async () => {
    await update.mutateAsync({
      checkin_section: null,
      checkin_expires_at: null,
      checkin_updated_at: new Date().toISOString(),
    });
  };

  const saveNote = async () => {
    const trimmed = noteInput.trim().slice(0, 60);
    if (!trimmed) return;
    if (containsBlockedWord(trimmed)) {
      toast.error("Let's keep it friendly 🙂");
      return;
    }
    const expires = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    await update.mutateAsync({
      checkin_status_note: trimmed,
      checkin_expires_at: expires,
      checkin_updated_at: new Date().toISOString(),
    });
    toast.success('Status set — visible on the map for 3h');
  };

  const clearNote = async () => {
    setNoteInput('');
    await update.mutateAsync({
      checkin_status_note: null,
      checkin_updated_at: new Date().toISOString(),
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left text-xl font-extrabold" style={{ color: 'hsl(var(--brand-navy))' }}>
            Check In
          </SheetTitle>
        </SheetHeader>

        {/* Privacy notice */}
        <div
          className="mt-3 mb-4"
          style={{
            background: 'rgba(14,51,134,0.08)',
            color: 'hsl(var(--brand-navy))',
            fontSize: 11,
            borderRadius: 8,
            padding: '8px 12px',
            lineHeight: 1.45,
          }}
        >
          Your bar and section are only visible to fans you've matched with or sent a Hi-Five to. Your exact location is never shared.
          Your status note is different — it's <strong>public</strong> and appears on the live map to everyone, including guests browsing without an account.
        </div>

        {/* Section 1 — Zone */}
        <section className="mb-5 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4" style={{ color: 'hsl(var(--brand-navy))' }} />
            <h3 className="text-sm font-extrabold" style={{ color: 'hsl(var(--foreground))' }}>Your Zone</h3>
          </div>
          <p className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
            {profile?.zip_code ? `ZIP ${profile.zip_code}` : 'Not set'}
          </p>
          <a
            href="/settings"
            className="mt-1 inline-block text-xs font-semibold"
            style={{ color: 'hsl(var(--brand-navy))' }}
          >
            Change in settings →
          </a>
        </section>

        {/* Section 2 — Bar */}
        <section className="mb-5 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Beer className="h-4 w-4" style={{ color: 'hsl(var(--brand-navy))' }} />
              <h3 className="text-sm font-extrabold" style={{ color: 'hsl(var(--foreground))' }}>
                Which bar are you at?
              </h3>
            </div>
            {currentBar && (
              <button
                onClick={() => { setBar(null); setOtherBar(''); setOtherOpen(false); }}
                className="text-xs font-bold flex items-center gap-1"
                style={{ color: 'hsl(var(--brand-red))' }}
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {BAR_CHIPS.map((b) => (
              <button
                key={b}
                onClick={() => { setOtherOpen(false); setBar(b); }}
                className={cn(
                  'min-h-[44px] rounded-full px-3.5 text-sm font-bold border-2 transition-colors',
                  currentBar === b
                    ? 'text-white border-transparent'
                    : 'bg-white border-border text-foreground hover:border-primary/50'
                )}
                style={currentBar === b ? { backgroundColor: 'hsl(var(--brand-navy))' } : undefined}
              >
                {b}
              </button>
            ))}
            <button
              onClick={() => setOtherOpen(true)}
              className={cn(
                'min-h-[44px] rounded-full px-3.5 text-sm font-bold border-2 transition-colors',
                otherOpen ? 'text-white border-transparent' : 'bg-white border-border text-foreground hover:border-primary/50'
              )}
              style={otherOpen ? { backgroundColor: 'hsl(var(--brand-navy))' } : undefined}
            >
              Other…
            </button>
          </div>
          {otherOpen && (
            <div className="mt-3 flex gap-2">
              <Input
                value={otherBar}
                onChange={(e) => setOtherBar(e.target.value.slice(0, 30))}
                placeholder="Bar name"
                maxLength={30}
              />
              <Button
                onClick={() => otherBar.trim() && setBar(otherBar.trim())}
                disabled={!otherBar.trim()}
                style={{ backgroundColor: 'hsl(var(--brand-navy))', color: 'white' }}
              >
                Save
              </Button>
            </div>
          )}
        </section>

        {/* Section 2b — Rooftop */}
        <section className="mb-5 rounded-xl border-2 border-amber-400/60 bg-amber-50/30 dark:bg-amber-950/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-extrabold" style={{ color: 'hsl(var(--foreground))' }}>
                🏙️ At a Rooftop?
              </h3>
            </div>
            {currentRooftop && (
              <button
                onClick={async () => {
                  await update.mutateAsync({ checkin_rooftop: null });
                  toast.success('Rooftop cleared');
                }}
                className="text-xs font-bold flex items-center gap-1 text-amber-700"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          {currentRooftop && (
            <p className="mb-2 text-xs font-bold text-amber-800">
              ✓ Checked in at 🏙️ {currentRooftop}
            </p>
          )}
          <RooftopPicker
            value={currentRooftop}
            onChange={async (name) => {
              await update.mutateAsync({ checkin_rooftop: name });
              toast.success(`Checked in at 🏙️ ${name}`);
            }}
          />
        </section>

        {/* Section 3 — Section (game-time only) */}
        {isHomeGameActive ? (
          <section className="mb-5 rounded-xl border-2 p-3" style={{ borderColor: 'hsl(var(--brand-red))' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" style={{ color: 'hsl(var(--brand-red))' }} />
                <h3 className="text-sm font-extrabold" style={{ color: 'hsl(var(--foreground))' }}>
                  What section are you in?
                </h3>
              </div>
              {liveSection && (
                <button
                  onClick={clearSection}
                  className="text-xs font-bold flex items-center gap-1"
                  style={{ color: 'hsl(var(--brand-red))' }}
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Label htmlFor="sec" className="text-sm whitespace-nowrap">Section</Label>
              <Input
                id="sec"
                value={sectionInput}
                onChange={(e) => setSectionInput(e.target.value.slice(0, 20))}
                placeholder="e.g. 200, 105, Bleachers"
                maxLength={20}
              />
              <Button
                onClick={saveSection}
                disabled={!sectionInput.trim()}
                style={{ backgroundColor: 'hsl(var(--brand-red))', color: 'white' }}
              >
                Save
              </Button>
            </div>
            <p className="mt-2 text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Auto-clears 3 hours after check-in.
            </p>
            {liveSection && expiresAt && (
              <p className="mt-1 text-[11px] font-semibold" style={{ color: 'hsl(var(--brand-navy))' }}>
                Currently visible: Section {liveSection} (until {new Date(expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})
              </p>
            )}
          </section>
        ) : (
          <section className="mb-5 rounded-xl border border-dashed border-border p-3">
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Section check-in opens during home games.
            </p>
          </section>
        )}

        {/* Section 4 — Status note */}
        <section className="mb-5 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" style={{ color: 'hsl(var(--brand-navy))' }} />
              <h3 className="text-sm font-extrabold" style={{ color: 'hsl(var(--foreground))' }}>
                What's your vibe right now?
              </h3>
            </div>
            {liveNote && (
              <button
                onClick={clearNote}
                className="text-xs font-bold flex items-center gap-1"
                style={{ color: 'hsl(var(--brand-red))' }}
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <Input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value.slice(0, 60))}
              placeholder="Pre-game beers! Where you at? 🍺"
              maxLength={60}
            />
            <Button
              onClick={saveNote}
              disabled={!noteInput.trim()}
              style={{ backgroundColor: 'hsl(var(--brand-navy))', color: 'white' }}
            >
              Set
            </Button>
          </div>
          <p className="mt-1 text-[11px] text-right" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {noteInput.length}/60
          </p>
          <p className="mt-2 text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Public on the live map for 3 hours — visible to everyone, including guests.
          </p>
          {liveNote && expiresAt && (
            <p className="mt-1 text-[11px] font-semibold" style={{ color: 'hsl(var(--brand-navy))' }}>
              Currently visible: "{liveNote}" (until {new Date(expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})
            </p>
          )}
        </section>

        <Button
          onClick={onClose}
          className="w-full min-h-[48px] font-bold"
          style={{ backgroundColor: 'hsl(var(--brand-navy))', color: 'white' }}
        >
          Done
        </Button>
      </SheetContent>
    </Sheet>
  );
}
