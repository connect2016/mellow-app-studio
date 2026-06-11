import { ComponentType } from 'react';
import { LucideProps } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InviteBuddyButton } from '@/components/invite/InviteBuddyButton';

interface EmptyStateProps {
  icon?: ComponentType<LucideProps> | string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Hide the default "Invite a Buddy" CTA. Defaults to false (CTA shown). */
  hideInviteCta?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  hideInviteCta,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          {typeof Icon === 'string' ? (
            <span className="text-3xl leading-none">{Icon}</span>
          ) : (
            <Icon size={48} className="text-muted-foreground" strokeWidth={1.75} />
          )}
        </div>
      )}
      <p className="text-[18px] text-foreground text-slate-50 font-semibold">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-[300px] text-muted-foreground text-base text-slate-50">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="secondary"
          className="mt-5 rounded-full font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          {actionLabel}
        </Button>
      )}
      {secondaryLabel && onSecondary && (
        <button
          type="button"
          onClick={onSecondary}
          className="mt-2 text-sm text-muted-foreground underline cursor-pointer hover:text-foreground transition-colors"
        >
          {secondaryLabel}
        </button>
      )}
      {!hideInviteCta && (
        <InviteBuddyButton source="empty-state" variant="empty-state" />
      )}
    </div>
  );
}

export default EmptyState;
