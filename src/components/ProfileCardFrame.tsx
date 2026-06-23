import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { BarChart3 } from 'lucide-react';
import cardFrame from '@/assets/card-frame-transparent.png';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { compressProfilePhoto } from '@/lib/image-compress';
import { Button } from '@/components/ui/button';
import { CardBackSide } from '@/components/card/CardBackSide';
import { CardStats, getVisibleStats } from '@/lib/cardStats';
import { StatPreference } from '@/hooks/useStatPreferences';

interface ProfileCardFrameProps {
  userName: string;
  profileImageUrl?: string;
  stats?: CardStats;
  statPreferences?: StatPreference[];
  isOwner?: boolean;
  userId?: string;
}

export function ProfileCardFrame({
  userName,
  profileImageUrl,
  stats,
  statPreferences,
  isOwner = false,
  userId,
}: ProfileCardFrameProps) {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(profileImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visibleStats = getVisibleStats({ stats, statPreferences, isOwner });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    setIsUploading(true);
    const previewUrl = URL.createObjectURL(file);
    setPhotoUrl(previewUrl);

    try {
      let publicUrl: string;
      try {
        const compressed = await compressProfilePhoto(file);
        const path = `${user.id}/${Date.now()}.webp`;

        const { error: uploadErr } = await supabase.storage
          .from('profile-photos')
          .upload(path, compressed, { contentType: 'image/webp' });
        if (uploadErr) throw uploadErr;

        publicUrl = supabase.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
      } catch (err: any) {
        toast.error(err?.message || 'Could not upload photo — try again');
        throw err;
      }

      // useUpdateProfile already toasts on success/failure, so no extra
      // toast here — just let its rejection fall through to the revert below.
      await updateProfile.mutateAsync({ profile_photo: publicUrl });
      setPhotoUrl(publicUrl);
    } catch {
      setPhotoUrl(profileImageUrl);
    } finally {
      URL.revokeObjectURL(previewUrl);
      setIsUploading(false);
    }
  };

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: 400 }}>
      <div
        className="relative w-full"
        style={{
          aspectRatio: '1768 / 2500',
          perspective: '1200px',
          WebkitPerspective: 1200,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)',
            willChange: 'transform',
          }}
        >
          {/* ===== FRONT SIDE (photo) ===== */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Photo layer (bottom) */}
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              role="button"
              aria-label={photoUrl ? `Change ${userName}'s profile photo` : `Add ${userName}'s profile photo`}
              style={{
                position: 'absolute',
                left: '48.7%',
                top: '42.5%',
                width: '45%',
                aspectRatio: '1 / 1',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                overflow: 'hidden',
                cursor: isUploading ? 'wait' : 'pointer',
                opacity: isUploading ? 0.6 : 1,
                background: '#d1d5db',
              }}
            >
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt={userName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                  }}
                />
              )}
            </div>

            {/* Frame layer (top) */}
            <img
              src={cardFrame}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                pointerEvents: 'none',
              }}
            />

            {/* Name layer — in the white strip above the gold stars */}
            <p
              title={userName}
              style={{
                position: 'absolute',
                bottom: '9%',
                left: '8%',
                right: '40%',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '0.01em',
                color: '#0E3386',
                zIndex: 4,
                textShadow: '0 1px 2px rgba(255,255,255,0.9)',
                background: 'transparent',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {userName || 'Fan'}
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* ===== BACK SIDE (stats) ===== */}
          <CardBackSide
            displayName={userName}
            visibleStats={visibleStats}
            isOwner={isOwner}
            userId={userId}
            onFlipBack={() => setIsFlipped(false)}
          />
        </div>
      </div>

      {/* Flip toggle — the only trigger for the flip, kept separate from the
          photo tap target above so upload and flip never compete for a click. */}
      {visibleStats.length > 0 && (
        <div className="mt-4 flex justify-center px-1">
          <Button
            variant="outline"
            size="default"
            className="w-full rounded-2xl gap-2 font-semibold min-h-[48px] px-6 shadow-sm active:scale-[0.97] transition-all"
            style={{
              background: 'hsl(var(--brand-navy))',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '15px',
              fontWeight: 700,
              borderRadius: '12px',
              padding: '14px 24px',
              letterSpacing: '0.02em',
            }}
            onClick={() => setIsFlipped((v) => !v)}
            aria-pressed={isFlipped}
            aria-label={isFlipped ? 'Flip back to profile' : 'View stats on back of card'}
          >
            <BarChart3 className="h-5 w-5" style={{ color: '#FFFFFF' }} />
            {isFlipped ? 'Back to Profile' : 'View Stats'}
          </Button>
        </div>
      )}
    </div>
  );
}
