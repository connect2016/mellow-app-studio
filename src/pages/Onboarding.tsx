import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { MakeYourCardDialog } from '@/components/card/MakeYourCardDialog';
import { Camera, Loader2, ChevronRight, Users, UsersRound, MapPin } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { SeasonTicketHolderToggle } from '@/components/profile/SeasonTicketHolderToggle';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';

// Cubs brand
const NAVY = 'hsl(var(--brand-navy))';
const RED = 'hsl(var(--brand-red))';

const SECTIONS = ['Bleachers', 'Grandstand', 'Rooftop', 'Suite'] as const;
const FREQUENCIES = ['Every game', 'Most games', 'Occasionally', 'First timer'] as const;

type GoalKey = 'buddy' | 'crew' | 'explore';
const GOAL_LABELS: Record<GoalKey, string> = {
  buddy: 'Find a Buddy',
  crew: 'Join a Crew',
  explore: 'Explore the Neighborhood',
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { uploadPhoto, uploading } = usePhotoUpload();

  const [step, setStep] = useState<1 | 2 | 3>(() => {
    const urlStep = parseInt(searchParams.get('step') || '');
    if (urlStep >= 1 && urlStep <= 3) return urlStep as 1 | 2 | 3;
    const draftRaw = sessionStorage.getItem('wb_onboarding_draft');
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (draft.step >= 1 && draft.step <= 3) return draft.step as 1 | 2 | 3;
      } catch {}
    }
    return 1;
  });
  const [displayName, setDisplayName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [section, setSection] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('');
  const [goal, setGoal] = useState<GoalKey | ''>('');
  const [isSTH, setIsSTH] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Prefill + skip if already completed (skip when a draft exists — draft wins)
  useEffect(() => {
    if (!profile) return;
    if (profile.onboarding_completed) {
      navigate('/discover', { replace: true });
      return;
    }
    const hasDraft = !!sessionStorage.getItem('wb_onboarding_draft');
    if (hasDraft) return;
    if (profile.display_name) setDisplayName(profile.display_name);
    if (profile.profile_photo) setPhotoUrl(profile.profile_photo);
    if (profile.wrigley_section) setSection(profile.wrigley_section);
    if ((profile as any).attendance_frequency) setFrequency((profile as any).attendance_frequency);
    if ((profile as any).is_season_ticket_holder) setIsSTH(true);
  }, [profile, navigate]);

  // Restore draft on mount
  useEffect(() => {
    const raw = sessionStorage.getItem('wb_onboarding_draft');
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft.formFields?.displayName) setDisplayName(draft.formFields.displayName);
      if (draft.formFields?.photoUrl) setPhotoUrl(draft.formFields.photoUrl);
      if (draft.formFields?.section) setSection(draft.formFields.section);
      if (draft.formFields?.frequency) setFrequency(draft.formFields.frequency);
      if (draft.formFields?.goal) setGoal(draft.formFields.goal);
      if (typeof draft.formFields?.isSTH === 'boolean') setIsSTH(draft.formFields.isSTH);
    } catch {
      // ignore corrupt draft
    }
  }, []);

  // Persist draft on every change
  useEffect(() => {
    const draft = {
      step,
      formFields: {
        displayName,
        photoUrl,
        section,
        frequency,
        goal,
        isSTH,
      },
    };
    sessionStorage.setItem('wb_onboarding_draft', JSON.stringify(draft));
  }, [step, displayName, photoUrl, section, frequency, goal, isSTH]);

  // Keep URL in sync with step so browser back moves backward through the flow
  useEffect(() => {
    const urlStep = parseInt(searchParams.get('step') || '');
    const validStep = urlStep >= 1 && urlStep <= 3 ? (urlStep as 1 | 2 | 3) : 1;
    setStep((current) => (validStep === current ? current : validStep));
  }, [searchParams]);

  const goToStep = (newStep: 1 | 2 | 3) => {
    setStep(newStep);
    const sp = new URLSearchParams(searchParams);
    sp.set('step', String(newStep));
    setSearchParams(sp);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    // Open the "Make your card" dialog — upload happens after crop confirm
    setPendingFile(file);
  };

  const step2Valid =
    displayName.trim().length >= 2 && section !== '' && frequency !== '';

  const goalToIntent = (g: GoalKey): string[] => {
    switch (g) {
      case 'buddy': return ['friend'];
      case 'crew': return ['meetup'];
      case 'explore': return ['friend', 'beer'];
    }
  };

  const finish = async (chosen: GoalKey) => {
    if (!user) return;
    setGoal(chosen);
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim(),
        profile_photo: photoUrl ?? '',
        wrigley_section: section,
        attendance_frequency: frequency,
        primary_goal: chosen,
        intent: goalToIntent(chosen),
        is_season_ticket_holder: isSTH,
        onboarding_completed: true,
      } as any);
      sessionStorage.removeItem('wb_onboarding_draft');
      track('onboarding_completed', {
        section,
        frequency,
        goal: chosen,
        photo: !!photoUrl,
      });
      setCelebrate(true);
      setTimeout(() => navigate('/discover', { replace: true }), 1800);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  // ---- Celebration screen ----
  if (celebrate) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
        style={{ background: NAVY }}
      >
        <div className="animate-scale-in flex flex-col items-center">
          <div
            className="mb-6 flex h-28 w-28 items-center justify-center rounded-full shadow-lg"
            style={{ background: RED }}
          >
            <ConceptIcon name="baseball" className="h-14 w-14 text-white" />
          </div>
          <h1
            className="mb-3 text-5xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'Norwester, sans-serif' }}
          >
            Let's Go Cubs!
          </h1>
          <p className="text-lg text-white/80">Welcome to the bleachers.</p>
          <div className="mt-8 flex gap-2">
            <span className="h-3 w-3 animate-bounce rounded-full bg-white [animation-delay:0ms]" />
            <span className="h-3 w-3 animate-bounce rounded-full bg-white [animation-delay:150ms]" />
            <span className="h-3 w-3 animate-bounce rounded-full bg-white [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  // ---- Step 1: Welcome ----
  if (step === 1) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center"
        style={{ background: NAVY }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <div
              className="flex h-32 w-32 items-center justify-center rounded-full shadow-lg"
              style={{ background: RED }}
            >
              <ConceptIcon name="baseball" className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1
            className="mb-4 text-4xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'Norwester, sans-serif' }}
          >
            Welcome to Cubbies Buddies
          </h1>
          <p className="mb-10 text-lg text-white/85">
            Find your crew at Wrigleyville.
          </p>
          <Button
            className="h-14 w-full rounded-full text-base font-bold text-white hover:opacity-90"
            style={{ background: RED }}
            onClick={() => {
              track('onboarding_step_completed', { step: 1 });
              goToStep(2);
            }}
          >
            Get Started <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
          <StepDots current={1} />
        </div>
      </div>
    );
  }

  // ---- Step 2: Profile setup ----
  if (step === 2) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-background px-6 py-10">
        <div className="w-full max-w-sm">
          <h1
            className="mb-1 text-3xl font-bold tracking-tight"
            style={{ color: NAVY, fontFamily: 'Norwester, sans-serif' }}
          >
            Set up your profile
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Tell fellow fans who you are.
          </p>

          {/* Photo */}
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative h-32 w-32 overflow-hidden rounded-full border-4 shadow-sm transition hover:opacity-90"
              style={{ borderColor: NAVY, background: '#eef1f7' }}
              aria-label="Upload photo"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Your photo" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                  <Camera className="h-7 w-7" />
                  <span className="mt-1 text-xs">Tap to upload</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: NAVY }} />
                </div>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={handleFile}
            />
            <MakeYourCardDialog
              open={!!pendingFile}
              file={pendingFile}
              displayName={displayName || 'You'}
              onClose={() => setPendingFile(null)}
              onUploaded={(url) => {
                setPhotoUrl(url);
                setPendingFile(null);
              }}
            />
          </div>

          {/* Display name */}
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: NAVY }}>
              Display name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
              placeholder="e.g. Cubbie Mike"
              maxLength={30}
              className="h-12 rounded-xl"
            />
          </div>

          {/* Section */}
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: NAVY }}>
              Favorite Wrigley section
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus-visible:outline-none focus-visible:ring-2"
              style={{ outlineColor: NAVY }}
            >
              <option value="">Pick a section</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Frequency */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold" style={{ color: NAVY }}>
              How often do you go to games?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCIES.map((f) => {
                const selected = frequency === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className="min-h-[48px] rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors"
                    style={{
                      borderColor: selected ? NAVY : 'hsl(var(--border))',
                      background: selected ? NAVY : 'transparent',
                      color: selected ? 'white' : 'hsl(var(--foreground))',
                    }}
                    aria-pressed={selected}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Season Ticket Holder */}
          <div className="mb-6">
            <SeasonTicketHolderToggle value={isSTH} onChange={setIsSTH} />
          </div>

          <Button
            className="h-14 w-full rounded-full text-base font-bold text-white hover:opacity-90"
            style={{ background: step2Valid ? NAVY : '#9aa3b8' }}
            disabled={!step2Valid || uploading}
            onClick={() => {
              track('onboarding_step_completed', { step: 2 });
              goToStep(3);
            }}
          >
            Continue <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
          <StepDots current={2} />
        </div>
      </div>
    );
  }

  // ---- Step 3: Primary goal ----
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        <h1
          className="mb-1 text-3xl font-bold tracking-tight"
          style={{ color: NAVY, fontFamily: 'Norwester, sans-serif' }}
        >
          What are you here for?
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Pick one — you can always switch it up later.
        </p>

        <div className="space-y-3">
          <GoalCard
            label={GOAL_LABELS.buddy}
            description="Match 1-on-1 with a fellow fan."
            icon={<Users className="h-6 w-6 text-white" />}
            onClick={() => finish('buddy')}
            disabled={saving}
          />
          <GoalCard
            label={GOAL_LABELS.crew}
            description="Roll with a 3–10 person group."
            icon={<UsersRound className="h-6 w-6 text-white" />}
            onClick={() => finish('crew')}
            disabled={saving}
          />
          <GoalCard
            label={GOAL_LABELS.explore}
            description="Bars, eats, and Wrigleyville spots."
            icon={<MapPin className="h-6 w-6 text-white" />}
            onClick={() => finish('explore')}
            disabled={saving}
          />
        </div>

        {saving && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving your spot...
          </div>
        )}

        <StepDots current={3} />
      </div>
    </div>
  );
}

function StepDots({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="h-2 rounded-full transition-all"
          style={{
            width: n === current ? 28 : 8,
            background: n <= current ? (current === 1 ? 'white' : NAVY) : (current === 1 ? 'rgba(255,255,255,0.35)' : 'hsl(var(--border))'),
          }}
        />
      ))}
    </div>
  );
}

interface GoalCardProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function GoalCard({ label, description, icon, onClick, disabled }: GoalCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] hover:shadow-sm disabled:opacity-50"
      style={{ borderColor: 'hsl(var(--border))', minHeight: 88 }}
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
        style={{ background: NAVY }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-lg font-bold" style={{ color: NAVY, fontFamily: 'Norwester, sans-serif' }}>
          {label}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0" style={{ color: RED }} />
    </button>
  );
}
