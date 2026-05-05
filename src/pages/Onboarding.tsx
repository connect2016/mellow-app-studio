import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';

const GATES = ['Addison', 'Waveland', 'Clark', 'Sheffield'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { uploadPhoto, uploading } = usePhotoUpload();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [zip, setZip] = useState('');
  const [gate, setGate] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Prefill from existing profile (e.g. Google name/photo)
  useEffect(() => {
    if (profile) {
      if (profile.display_name) setDisplayName(profile.display_name);
      if (profile.profile_photo) setPhotoUrl(profile.profile_photo);
      if ((profile as any).zip_code) setZip((profile as any).zip_code);
      if ((profile as any).favorite_gate) setGate((profile as any).favorite_gate);
    }
  }, [profile]);

  // Already completed → bounce out
  useEffect(() => {
    if (profile?.onboarding_completed) navigate('/profile', { replace: true });
  }, [profile, navigate]);

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

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim(),
        profile_photo: photoUrl ?? '',
        zip_code: zip || null,
        favorite_gate: gate || null,
        onboarding_completed: true,
      });
      track('onboarding_completed', {
        zip_provided: !!zip,
        gate_provided: !!gate,
        photo_provided: !!photoUrl,
      });
      toast.success("You're in the bleachers!");
      navigate('/profile', { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const nameValid = displayName.trim().length >= 2 && displayName.trim().length <= 30;
  const zipValid = /^\d{5}$/.test(zip);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((n) => (
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
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
              placeholder="Your fan name (e.g. Cubbie Mike)"
              maxLength={30}
              autoFocus
            />
            <Button className="w-full" disabled={!nameValid} onClick={() => setStep(2)}>
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
              <Button className="w-full" onClick={() => setStep(3)} disabled={uploading}>
                Next
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setPhotoUrl(null);
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
              <h1 className="mb-2 text-3xl font-bold tracking-tight">Where do you tailgate?</h1>
              <p className="text-sm text-muted-foreground">We'll match you with fans in your zone.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Zip code</label>
              <Input
                inputMode="numeric"
                pattern="\d{5}"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="60613"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Favorite gate</label>
              <select
                value={gate}
                onChange={(e) => setGate(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">Pick a gate</option>
                {GATES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <Button
              className="w-full"
              variant="premium"
              disabled={!zipValid || !gate || saving}
              onClick={handleFinish}
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Let's go!"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
