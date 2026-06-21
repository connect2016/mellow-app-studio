import { useRef, useState } from 'react';
import { toast } from 'sonner';
import cardFrame from '@/assets/card-frame-transparent.png';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { compressProfilePhoto } from '@/lib/image-compress';

interface ProfileCardFrameProps {
  userName: string;
  profileImageUrl?: string;
}

export function ProfileCardFrame({ userName, profileImageUrl }: ProfileCardFrameProps) {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(profileImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div
      style={{
        position: 'relative',
        aspectRatio: '1768 / 2500',
        maxWidth: 400,
        width: '100%',
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
