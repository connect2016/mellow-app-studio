import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RosterCardProps {
  photo?: string | null;
  displayName: string;
  caption?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Shared compact row for the Dugout page — used for both incoming requests
 * and confirmed teammates so the two sections read as one visual system
 * instead of a notification list bolted onto a card deck. The framed photo
 * echoes the navy/red trading-card palette without the full UserBaseballCard
 * weight; that's still one tap away via onClick.
 */
export function RosterCard({ photo, displayName, caption, right, onClick, className }: RosterCardProps) {
  const initial = (displayName || 'A').trim().charAt(0).toUpperCase();

  const content = (
    <>
      <div
        className="shrink-0 h-14 w-14 rounded-xl overflow-hidden ring-2 ring-[hsl(var(--brand-red))] flex items-center justify-center"
        style={!photo ? { background: 'linear-gradient(135deg, hsl(var(--brand-navy)) 0%, #0a3a85 100%)' } : undefined}
      >
        {photo ? (
          <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <span className="text-lg font-bold text-white">{initial}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm text-[hsl(var(--brand-navy))] truncate">{displayName}</p>
        {caption && <div className="text-xs text-[hsl(var(--brand-navy))]/70 truncate mt-0.5">{caption}</div>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </>
  );

  const baseClass = cn('w-full flex items-center gap-3 rounded-2xl bg-white/95 p-2.5 shadow-sm', className);

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(baseClass, 'text-left active:scale-[0.99] transition-transform')}>
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
