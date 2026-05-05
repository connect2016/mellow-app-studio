import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { track } from '@/lib/analytics';

export function usePhotoUpload() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/avatar.${ext}`;

      // Upload (upsert to replace existing)
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Save to profile
      await updateProfile.mutateAsync({ profile_photo: publicUrl });

      track('photo_uploaded', { surface: 'avatar', size_kb: Math.round(file.size / 1024) });

      return publicUrl;
    } catch (err) {
      console.error('Photo upload failed:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploadPhoto, uploading };
}
