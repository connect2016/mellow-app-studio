import { Button } from '@/components/ui/button';
import { useTeammateState, useSendTeammateRequest, useRemoveTeammate, useRespondToRequest } from '@/hooks/useTeammates';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, CheckCircle2, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecruitButtonProps {
  otherUserId: string;
  className?: string;
}

/** Prominent CTA that handles all 4 states: none, pending-outgoing, pending-incoming, accepted. */
export function RecruitButton({ otherUserId, className }: RecruitButtonProps) {
  const { user } = useAuth();
  const { data: state, isLoading } = useTeammateState(otherUserId);
  const send = useSendTeammateRequest();
  const respond = useRespondToRequest();
  const remove = useRemoveTeammate();

  if (!user || user.id === otherUserId) return null;
  if (isLoading) {
    return (
      <Button disabled className={cn('w-full rounded-xl h-12 font-semibold', className)}>
        <Clock className="mr-2 h-4 w-4 animate-pulse" /> Loading…
      </Button>
    );
  }

  // Already teammates
  if (state?.status === 'accepted') {
    return (
      <Button
        variant="outline"
        onClick={() => remove.mutate(otherUserId)}
        disabled={remove.isPending}
        className={cn(
          'w-full rounded-xl h-12 font-semibold border-2 border-primary/40 bg-primary/5 text-primary',
          className
        )}
      >
        <CheckCircle2 className="mr-2 h-5 w-5" /> Teammate
      </Button>
    );
  }

  // Pending request — incoming (other person invited me)
  if (state?.status === 'pending' && state.recipient_id === user.id) {
    return (
      <div className={cn('flex gap-2', className)}>
        <Button
          onClick={() => respond.mutate({ id: state.id, accept: true })}
          disabled={respond.isPending}
          className="flex-1 rounded-xl h-12 font-semibold bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-deep))]"
        >
          <CheckCircle2 className="mr-2 h-5 w-5" /> Accept Recruit
        </Button>
        <Button
          variant="outline"
          onClick={() => respond.mutate({ id: state.id, accept: false })}
          disabled={respond.isPending}
          className="rounded-xl h-12 px-4"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // Pending request — outgoing (I invited them)
  if (state?.status === 'pending' && state.requester_id === user.id) {
    return (
      <Button
        variant="outline"
        onClick={() => remove.mutate(otherUserId)}
        disabled={remove.isPending}
        className={cn('w-full rounded-xl h-12 font-semibold', className)}
      >
        <Clock className="mr-2 h-5 w-5" /> Recruit Pending — Cancel?
      </Button>
    );
  }

  // No relationship yet
  return (
    <Button
      onClick={() => send.mutate(otherUserId)}
      disabled={send.isPending}
      className={cn(
        'w-full rounded-xl h-12 font-semibold text-white shadow-lg',
        'bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all',
        className
      )}
    >
      <UserPlus className="mr-2 h-5 w-5" /> Recruit to Team
    </Button>
  );
}
