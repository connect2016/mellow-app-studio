import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { useMyReferralCode } from '@/hooks/useReferral';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const SHARE_BASE = 'https://wrigleyvillebuddies.com';
const SHARE_MESSAGE =
  "I'm using Cubbies Buddies to find my crew at Wrigley — join me!";

interface InviteFriendsButtonProps {
  source: string;
  className?: string;
  fullWidth?: boolean;
  variant?: 'primary' | 'outline';
}

export function buildReferralUrl(code: string | null | undefined): string {
  return code ? `${SHARE_BASE}?ref=${encodeURIComponent(code)}` : SHARE_BASE;
}

export function InviteFriendsButton({
  source,
  className,
  fullWidth = true,
  variant = 'primary',
}: InviteFriendsButtonProps) {
  const { data: code, isLoading } = useMyReferralCode();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy || isLoading) return;
    setBusy(true);
    haptic('light');

    const url = buildReferralUrl(code);
    const text = `${SHARE_MESSAGE} ${SHARE_BASE}${code ? `?ref=${code}` : ''}`;
    const shareData: ShareData = {
      title: 'Cubbies Buddies',
      text,
      url,
    };

    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        try {
          await (navigator as any).share(shareData);
          track('invite_friends_shared', { source, method: 'native', code });
          return;
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
        }
      }

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success('Invite link copied! Share it with your crew.');
        track('invite_friends_shared', { source, method: 'clipboard', code });
      } else {
        window.prompt('Copy this invite link:', text);
        track('invite_friends_shared', { source, method: 'prompt', code });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={busy || isLoading}
      aria-label="Invite Friends"
      className={cn(
        'rounded-xl h-12 font-semibold gap-2',
        fullWidth && 'w-full',
        variant === 'primary' && 'text-white',
        className,
      )}
      style={
        variant === 'primary'
          ? { backgroundColor: '#CC3433', color: '#FFFFFF' }
          : undefined
      }
      variant={variant === 'outline' ? 'outline' : 'default'}
    >
      {busy || isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ConceptIcon name="sparkles" className="h-4 w-4" />
      )}
      Invite Friends
    </Button>
  );
}

export default InviteFriendsButton;
