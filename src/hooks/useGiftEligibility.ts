import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { checkRecipientEligibility, type EligibilityResult } from '@/lib/gift-trust-safety';

/**
 * Returns whether a recipient can receive monetary gifts.
 * For non-fan contexts (meetup, bar, general) we treat as eligible — the
 * underlying recipients are screened via meetup/bar membership.
 */
export function useGiftEligibility(recipientUserId?: string) {
  const { user } = useAuth();

  return useQuery<EligibilityResult>({
    queryKey: ['gift-eligibility', recipientUserId, user?.id],
    queryFn: () => checkRecipientEligibility(recipientUserId!, user?.id),
    enabled: !!recipientUserId && !!user,
    staleTime: 5 * 60 * 1000,
  });
}
