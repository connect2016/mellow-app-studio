import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { CardFrontSide } from '@/components/card/CardFrontSide';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { Loader2, ZoomIn, ZoomOut, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { shareFanCard } from '@/lib/share-fan-card';

interface MakeYourCardDialogProps {
  open: boolean;
  file: File | null;
  displayName: string;
  onClose: () => void;
  /** Called with the public URL after a successful upload. */
  onUploaded?: (url: string) => void;
}

async function getCroppedBlob(imageSrc: string, pixels: Area): Promise<Blob> {
  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = imageSrc;
  });

  const MAX = 800;
  const scale = Math.min(1, MAX / Math.max(pixels.width, pixels.height));
  const w = Math.max(1, Math.round(pixels.width * scale));
  const h = Math.max(1, Math.round(pixels.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, w, h);

  // Try webp at descending qualities until under 300KB
  for (const q of [0.9, 0.8, 0.7, 0.6, 0.5]) {
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob((b) => r(b), 'image/webp', q),
    );
    if (blob && blob.size < 300_000) return blob;
    if (blob && q === 0.5) return blob;
  }
  // Fallback to jpeg
  const jpeg = await new Promise<Blob | null>((r) =>
    canvas.toBlob((b) => r(b), 'image/jpeg', 0.75),
  );
  if (!jpeg) throw new Error('Encoding failed');
  return jpeg;
}

export function MakeYourCardDialog({
  open,
  file,
  displayName,
  onClose,
  onUploaded,
}: MakeYourCardDialogProps) {
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedURL, setUploadedURL] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const { uploadPhoto } = usePhotoUpload();
  const lastBlobRef = useRef<{ blob: Blob; name: string } | null>(null);

  // Reset crop state whenever a new file is opened
  useEffect(() => {
    if (open && file) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedPixels(null);
      lastBlobRef.current = null;
    }
  }, [open, file]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!file || !objectUrl || !croppedPixels) return;
    setSubmitting(true);
    try {
      const blob =
        lastBlobRef.current?.blob ?? (await getCroppedBlob(objectUrl, croppedPixels));
      const name = (file.name.split('.').slice(0, -1).join('.') || 'photo').slice(0, 40);
      const cropped = new File([blob], `${name}.${blob.type === 'image/webp' ? 'webp' : 'jpg'}`, {
        type: blob.type,
      });
      lastBlobRef.current = { blob, name };
      const url = await uploadPhoto(cropped);
      if (url) {
        onUploaded?.(url);
        onClose();
      }
    } catch (err) {
      // usePhotoUpload already toasts on failure; surface a generic catch here too
      if (!(err instanceof Error) || !err.message.includes('upload')) {
        toast.error('Could not save your card', {
          id: 'card-crop-error',
          action: { label: 'Retry', onClick: () => void handleConfirm() },
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !submitting) onClose();
      }}
    >
      <DialogContent
        className="max-w-md p-0 gap-0 sm:rounded-2xl overflow-hidden"
        onInteractOutside={(e) => submitting && e.preventDefault()}
      >
        <div className="bg-[hsl(var(--brand-navy))] px-6 pt-6 pb-2 text-center">
          <DialogTitle
            className="text-2xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'Norwester, sans-serif' }}
          >
            Make your card
          </DialogTitle>
          <DialogDescription className="sr-only">
            Position and zoom your photo inside the card frame, then confirm.
          </DialogDescription>
        </div>

        <div className="bg-[hsl(var(--brand-navy))] px-6 pt-2 pb-4">
          {/* Live card preview with Cropper inside the avatar slot */}
          <div className="mx-auto" style={{ maxWidth: 280, aspectRatio: '3 / 4.2' }}>
            <div className="relative w-full h-full">
              <CardFrontSide
                profileImage={null}
                displayName={displayName || 'You'}
                statusLabel={null}
                activeReactions={[]}
                imgLoaded
                onImgLoad={() => {}}
                avatarSlot={
                  objectUrl ? (
                    <div className="absolute inset-0">
                      <Cropper
                        image={objectUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        minZoom={1}
                        maxZoom={4}
                        zoomSpeed={0.5}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        style={{
                          containerStyle: {
                            position: 'absolute',
                            inset: 0,
                            background: 'transparent',
                          },
                          cropAreaStyle: {
                            border: 'none',
                            boxShadow: 'none',
                            color: 'transparent',
                          },
                        }}
                      />
                    </div>
                  ) : null
                }
              />
              {submitting && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/55 backdrop-blur-sm">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-sm font-medium text-white/85">
            Looking like a starter.
          </p>
        </div>

        <div className="bg-background px-6 py-5 space-y-4">
          {/* Zoom slider */}
          <div>
            <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1"><ZoomOut className="h-3.5 w-3.5" />Zoom</span>
              <span className="flex items-center gap-1"><ZoomIn className="h-3.5 w-3.5" /></span>
            </label>
            <Slider
              value={[zoom]}
              min={1}
              max={4}
              step={0.05}
              onValueChange={(v) => setZoom(v[0])}
              disabled={submitting}
              aria-label="Zoom"
            />
            <p className="mt-2 text-[11px] text-muted-foreground text-center">
              Drag the photo to reposition · Pinch to zoom on touch
            </p>
          </div>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !croppedPixels}
            className="w-full h-12 rounded-2xl text-base font-bold text-white"
            style={{ background: 'hsl(var(--brand-red))' }}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving…
              </>
            ) : (
              'Put me in, Coach'
            )}
          </Button>

          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
