import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useGeolocation } from '@/hooks/useGeolocation';
import { GeolocationModal } from '@/components/GeolocationModal';
import { Camera, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import { InviteBuddyButton } from '@/components/invite/InviteBuddyButton';

const GATES = ['Addison', 'Waveland', 'Clark', 'Sheffield'];

const WATCH_OPTIONS = ['Bleachers', 'Lower Bowl', 'Upper Deck', 'Rooftop Bar', 'Bar/Restaurant', 'Home'];
const ARRIVAL_OPTIONS = ['Gates open (3hr early)', '1–2hrs before', 'Right at first pitch', 'Whenever'];
const VIBE_OPTIONS = ['Hardcore stats fan', 'Party section', 'Family friendly', 'Meet new people', 'Quiet & focused'];

const TOTAL_STEPS = 5;

type ChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition-colors duration-150 ease-out ${
        selected
          ? 'border-[#0E3386] bg-[#0E3386] text-white'
          : 'border-neutral-300 bg-transparent text-neutral-600 hover:border-neutral-400'
      }`}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusField = searchParams.get('focus');
  const editMode = searchParams.get('edit') === '1';
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { uploadPhoto, uploading } = usePhotoUpload();
  const geo = useGeolocation();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [zip, setZip] = useState('');
  const [gate, setGate] = useState('');
  const [watchLocations, setWatchLocations] = useState<string[]>([]);
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [manualZip, setManualZip] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const errorStyle = { color: '#CC3433', fontSize: '12px', marginTop: '4px' } as const;

  const validateStep1 = () => {
    const next: Record<string, string> = {};
    if (!displayName.trim()) next.displayName = 'Display name is required';
    else if (displayName.trim().length < 2) next.displayName = 'Must be at least 2 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep4 = () => {
    const next: Record<string, string> = {};
    if (!zip.trim()) next.zip = 'Zip code is required';
    else if (!/^\d{5}$/.test(zip)) next.zip = 'Enter a valid 5-digit zip';
    if (!gate) next.gate = 'Please pick a favorite gate';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep5 = () => {
    const next: Record<string, string> = {};
    if (!finalZip.trim()) next.finalZip = 'Zip code is required';
    else if (!/^\d{5}$/.test(finalZip)) next.finalZip = 'Enter a valid 5-digit zip';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Prefill from existing profile
  useEffect(() => {
    if (profile) {
      if (profile.display_name) setDisplayName(profile.display_name);
      if (profile.profile_photo) setPhotoUrl(profile.profile_photo);
      if ((profile as any).zip_code) setZip((profile as any).zip_code);
      if ((profile as any).favorite_gate) setGate((profile as any).favorite_gate);
      if ((profile as any).watch_locations) setWatchLocations((profile as any).watch_locations);
      if ((profile as any).arrival_time) setArrivalTime((profile as any).arrival_time);
      if ((profile as any).vibe_tags) setVibeTags((profile as any).vibe_tags);
    }
  }, [profile]);

  // Already completed → bounce out (unless explicitly editing via ?edit=1)
  useEffect(() => {
    if (profile?.onboarding_completed && !editMode) navigate('/profile', { replace: true });
  }, [profile, navigate, editMode]);

  // Jump to the step that owns the focused field, then focus the input
  useEffect(() => {
    if (!focusField) return;
    const stepFor: Record<string, number> = {
      display_name: 1,
      profile_photo: 2,
      vibe_tags: 3,
      favorite_gate: 4,
      zip_code: 4,
    };
    const targetStep = stepFor[focusField];
    if (targetStep) setStep(targetStep);
    const t = setTimeout(() => {
      document.getElementById(focusField)?.focus();
    }, 150);
    return () => clearTimeout(t);
  }, [focusField]);

  // When geo grants and returns a zip, capture it for step 5
  useEffect(() => {
    if (geo.permission === 'granted' && geo.zip) {
      setManualZip(geo.zip);
    }
  }, [geo.permission, geo.zip]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadPhoto(file);
      if (url) setPhotoUrl(url);
    } catch {
      toast.error("Couldn't upload photo, try again.");
    }
  };

  const toggleMulti = (arr: string[], setArr: (a: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const step3Valid = watchLocations.length >= 1 && arrivalTime !== '' && vibeTags.length >= 1;
  const nameValid = displayName.trim().length >= 2 && displayName.trim().length <= 30;
  const zipValid = /^\d{5}$/.test(zip);
  const finalZip = manualZip || zip;
  const finalZipValid = /^\d{5}$/.test(finalZip);

  const handleFinish = async (method: 'location' | 'zip') => {
    if (!user) return;
    if (!validateStep5()) return;
    setSubmitError(null);
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim(),
        profile_photo: photoUrl ?? '',
        zip_code: finalZip || null,
        favorite_gate: gate || null,
        watch_locations: watchLocations,
        arrival_time: arrivalTime || null,
        vibe_tags: vibeTags,
        onboarding_completed: true,
      } as any);
      track('onboarding_step_completed', { step: 5, method });
      track('onboarding_completed', {
        zip_provided: !!finalZip,
        gate_provided: !!gate,
        photo_provided: !!photoUrl,
        watch_count: watchLocations.length,
        vibe_count: vibeTags.length,
      });
      toast.success("Profile updated!", { duration: 3000 });
      navigate('/profile', { replace: true });
    } catch (err) {
      console.error(err);
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={`h-2 rounded-full transition-all ${
                n === step ? 'w-8 bg-primary' : n < step ? 'w-2 bg-primary' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight">What should we call you?</h1>
              <p className="text-sm text-muted-foreground">This is how other Cubbies fans will see you.</p>
            </div>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value.slice(0, 30));
                if (errors.displayName) setErrors((p) => ({ ...p, displayName: '' }));
              }}
              placeholder="Your fan name (e.g. Cubbie Mike)"
              maxLength={30}
              autoFocus
              aria-invalid={!!errors.displayName}
            />
            {errors.displayName && (
              <p style={errorStyle}>{errors.displayName}</p>
            )}
            <Button
              className="w-full"
              onClick={() => {
                if (!validateStep1()) return;
                track('onboarding_step_completed', { step: 1 });
                setStep(2);
              }}
            >
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight">Add your fan photo</h1>
              <p className="text-sm text-muted-foreground">Show your bleacher pride.</p>
            </div>

            <div className="flex justify-center">
              <button
                id="profile_photo"
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-primary bg-muted shadow-md transition hover:opacity-90"
                aria-label="Upload photo"
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Your fan photo" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                    <Camera className="h-8 w-8" />
                    <span className="mt-1 text-xs">Tap to upload</span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => {
                  track('onboarding_step_completed', { step: 2, photo: !!photoUrl });
                  setStep(3);
                }}
                disabled={uploading}
              >
                Next
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setPhotoUrl(null);
                  track('onboarding_step_completed', { step: 2, photo: false });
                  setStep(3);
                }}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight">How do you Cubs?</h1>
              <p className="text-sm text-muted-foreground">We'll find fans who match your game-day style.</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Where do you watch?</p>
              <div className="flex flex-wrap gap-2">
                {WATCH_OPTIONS.map((opt) => (
                  <Chip
                    key={opt}
                    label={opt}
                    selected={watchLocations.includes(opt)}
                    onClick={() => toggleMulti(watchLocations, setWatchLocations, opt)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">When do you show up?</p>
              <div className="flex flex-wrap gap-2">
                {ARRIVAL_OPTIONS.map((opt) => (
                  <Chip
                    key={opt}
                    label={opt}
                    selected={arrivalTime === opt}
                    onClick={() => setArrivalTime(arrivalTime === opt ? '' : opt)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3" id="vibe_tags" tabIndex={-1}>
              <p className="text-sm font-medium">Your game-day vibe?</p>
              <div className="flex flex-wrap gap-2">
                {VIBE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt}
                    label={opt}
                    selected={vibeTags.includes(opt)}
                    onClick={() => toggleMulti(vibeTags, setVibeTags, opt)}
                  />
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={!step3Valid}
              onClick={() => {
                track('onboarding_step_completed', {
                  step: 3,
                  watch_count: watchLocations.length,
                  vibe_count: vibeTags.length,
                  arrival: arrivalTime,
                });
                setStep(4);
              }}
            >
              Next
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight">Where do you tailgate?</h1>
              <p className="text-sm text-muted-foreground">We'll match you with fans in your zone.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Zip code</label>
              <Input
                id="zip_code"
                inputMode="numeric"
                pattern="\d{5}"
                maxLength={5}
                value={zip}
                onChange={(e) => {
                  setZip(e.target.value.replace(/\D/g, '').slice(0, 5));
                  if (errors.zip) setErrors((p) => ({ ...p, zip: '' }));
                }}
                placeholder="60613"
                aria-invalid={!!errors.zip}
              />
              {errors.zip && <p style={errorStyle}>{errors.zip}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Favorite gate</label>
              <select
                id="favorite_gate"
                value={gate}
                onChange={(e) => {
                  setGate(e.target.value);
                  if (errors.gate) setErrors((p) => ({ ...p, gate: '' }));
                }}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-invalid={!!errors.gate}
              >
                <option value="">Pick a gate</option>
                {GATES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {errors.gate && <p style={errorStyle}>{errors.gate}</p>}
            </div>

            <Button
              className="w-full"
              onClick={() => {
                if (!validateStep4()) return;
                track('onboarding_step_completed', { step: 4 });
                setStep(5);
              }}
            >
              Next
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            {submitError && (
              <div
                role="alert"
                style={{
                  background: '#FDECEC',
                  border: '1px solid #CC3433',
                  color: '#CC3433',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                }}
              >
                {submitError}
              </div>
            )}
            <div className="text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight">Find your section crew</h1>
              <p className="text-sm text-muted-foreground">We show nearby fans during game days only.</p>
            </div>

            <Button
              className="w-full gap-2"
              variant="premium"
              onClick={() => geo.requestPosition()}
              disabled={saving}
            >
              <MapPin className="h-4 w-4" />
              {geo.permission === 'granted' && geo.zip
                ? `Location on · ZIP ${geo.zip}`
                : 'Use my location'}
            </Button>

            <div className="space-y-2">
              <label className="text-sm font-medium">Or enter zip code manually</label>
              <Input
                inputMode="numeric"
                pattern="\d{5}"
                maxLength={5}
                value={manualZip}
                onChange={(e) => {
                  setManualZip(e.target.value.replace(/\D/g, '').slice(0, 5));
                  if (errors.finalZip) setErrors((p) => ({ ...p, finalZip: '' }));
                }}
                placeholder="60613"
                aria-invalid={!!errors.finalZip}
              />
              {errors.finalZip && <p style={errorStyle}>{errors.finalZip}</p>}
            </div>

            <Button
              className="w-full"
              variant="premium"
              disabled={saving}
              onClick={() =>
                handleFinish(geo.permission === 'granted' && geo.zip === manualZip ? 'location' : 'zip')
              }
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Let's go!"}
            </Button>

            <div className="pt-2 border-t border-border/40">
              <p className="text-center text-xs text-muted-foreground mb-2">Bring a friend along</p>
              <InviteBuddyButton source="onboarding-final" variant="outline" label="Invite your first buddy →" />
            </div>
          </div>
        )}

        <GeolocationModal
          open={geo.showModal}
          onOpenChange={geo.setShowModal}
          controller={geo}
        />
      </div>
    </div>
  );
}
