import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { useGeolocation } from '@/hooks/useGeolocation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional shared instance from parent. If absent we mount our own. */
  controller?: ReturnType<typeof useGeolocation>;
}

/**
 * Privacy-first location modal. Native browser prompt is only triggered
 * by clicking "Allow location". "Not now" lets the user enter a zip
 * manually and never re-prompts in this session.
 */
export function GeolocationModal({ open, onOpenChange, controller }: Props) {
  const owned = useGeolocation();
  const ctrl = controller ?? owned;
  const [showZipInput, setShowZipInput] = useState(false);
  const [zipDraft, setZipDraft] = useState('');
  const [zipError, setZipError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAllow = async () => {
    try {
      await ctrl.allow();
      onOpenChange(false);
    } catch {
      // ctrl.error is already set; offer manual zip path
      setShowZipInput(true);
    }
  };

  const handleDeclineClick = () => {
    setShowZipInput(true);
  };

  const handleZipSave = async () => {
    const trimmed = zipDraft.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setZipError('Enter a 5-digit ZIP code');
      return;
    }
    setZipError(null);
    setSubmitting(true);
    try {
      await ctrl.decline(trimmed);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipEntirely = async () => {
    setSubmitting(true);
    try {
      await ctrl.decline();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <div className="flex flex-col items-center text-center pt-2">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-8 w-8 text-primary" strokeWidth={2.25} />
          </div>
          <DialogTitle className="text-xl font-bold">
            Find fans near your section
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We use your location during games only to show nearby fans. We never
            store your exact GPS coordinates or share your location with other
            users.
          </DialogDescription>
          <Link
            to="/privacy"
            className="mt-2 text-xs font-medium text-primary underline underline-offset-2"
            onClick={() => onOpenChange(false)}
          >
            Read our Privacy Policy
          </Link>

          {ctrl.error && (
            <p className="mt-3 text-xs text-destructive">{ctrl.error}</p>
          )}

          {!showZipInput ? (
            <div className="mt-6 flex w-full flex-col gap-3">
              <Button
                onClick={handleAllow}
                disabled={ctrl.loading}
                className="w-full min-h-[48px] rounded-xl text-base"
              >
                {ctrl.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Allow location'
                )}
              </Button>
              <button
                type="button"
                onClick={handleDeclineClick}
                className="text-sm font-medium text-muted-foreground underline underline-offset-2 min-h-[48px]"
              >
                Not now — enter zip instead
              </button>
            </div>
          ) : (
            <div className="mt-6 flex w-full flex-col gap-3">
              <Input
                inputMode="numeric"
                pattern="\d{5}"
                maxLength={5}
                placeholder="ZIP code"
                value={zipDraft}
                onChange={(e) => {
                  setZipDraft(e.target.value.replace(/\D/g, '').slice(0, 5));
                  if (zipError) setZipError(null);
                }}
                className="h-12 text-center text-lg tracking-widest rounded-xl"
                aria-invalid={!!zipError}
              />
              {zipError && <p className="text-xs text-destructive">{zipError}</p>}
              <Button
                onClick={handleZipSave}
                disabled={submitting || zipDraft.length !== 5}
                className="w-full min-h-[48px] rounded-xl text-base"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save ZIP
              </Button>
              <button
                type="button"
                onClick={handleSkipEntirely}
                className="text-xs text-muted-foreground underline underline-offset-2"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
