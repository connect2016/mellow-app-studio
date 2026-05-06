import { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'empty-state';

interface InviteBuddyButtonProps {
  source: string;            // analytics tag: 'profile' | 'empty-state' | 'onboarding-final' | …
  className?: string;
  variant?: Variant;
  label?: string;
  fullWidth?: boolean;
}

export function buildInviteUrl(userId: string | null | undefined): string {
  const base = 'https://cubbiesbuddies.com/join';
  return userId ? `${base}?ref=${userId}` : base;
}

export function InviteBuddyButton({
  source,
  className,
  variant = 'outline',
  label = 'Invite a Buddy',
  fullWidth = true,
}: InviteBuddyButtonProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    haptic('light');

    const inviteUrl = buildInviteUrl(user?.id ?? null);
    const shareData = {
      title: 'Join my Cubbies Buddies crew',
      text: 'I\'m on Cubbies Buddies — find your Cubs crew at Wrigleyville. Join me:',
      url: inviteUrl,
    };

    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        try {
          await (navigator as any).share(shareData);
          track('invite_link_shared', { source, method: 'native' });
          return;
        } catch (err: any) {
          // User cancelled — bail silently. Anything else, fall through to copy.
          if (err?.name === 'AbortError') return;
        }
      }

      // Fallback: copy to clipboard
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
        toast.success('Invite link copied! Send it to your crew.');
        track('invite_link_copied', { source, method: 'clipboard' });
      } else {
        // Last-ditch: prompt
        window.prompt('Copy this invite link:', inviteUrl);
        track('invite_link_copied', { source, method: 'prompt' });
      }
    } finally {
      setBusy(false);
    }
  };

  const baseProps = {
    onClick: handleClick,
    disabled: busy,
    'aria-label': label,
  };

  if (variant === 'empty-state') {
    return (
      <button
        type="button"
        {...baseProps}
        className={cn(
          'mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#0E3386] hover:underline underline-offset-4 min-h-[44px] px-2',
          className,
        )}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        {label}
      </button>
    );
  }

  return (
    <Button
      {...baseProps}
      variant={variant === 'ghost' ? 'ghost' : variant === 'primary' ? 'default' : 'outline'}
      className={cn(
        'rounded-xl h-12 font-semibold gap-2',
        fullWidth && 'w-full',
        className,
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
      {label}
    </Button>
  );
}

export default InviteBuddyButton;
