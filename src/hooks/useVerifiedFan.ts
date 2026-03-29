import { useProfile } from '@/hooks/useProfile';

/**
 * Returns whether the current user is a Verified Fan.
 */
export function useVerifiedFan() {
  const { data: profile, isLoading } = useProfile();
  return {
    isVerified: !!profile?.is_verified,
    isLoading,
  };
}
