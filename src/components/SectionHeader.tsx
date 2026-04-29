/**
 * SectionHeader — standardized section title row with a small icon
 * to the left, bold typography, optional subtitle, and an optional
 * trailing action (e.g. "See all").
 *
 * Use this anywhere we previously had ad-hoc section h2's with emoji.
 */
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  /** Small icon rendered in the leading chip. Pass a Lucide icon element. */
  icon: ReactNode;
  title: string;
  subtitle?: string;
  /** Optional trailing element (link, button) on the right side. */
  trailing?: ReactNode;
  /** Use brighter "on-image" text colors when sitting on a photo background. */
  onImage?: boolean;
  className?: string;
  /** Title id for aria-labelledby on the parent section. */
  id?: string;
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  trailing,
  onImage = false,
  className,
  id,
}: SectionHeaderProps) {
  const titleColor = onImage ? 'text-white drop-shadow-md' : 'text-foreground';
  const subColor = onImage ? 'text-white/80' : 'text-muted-foreground';

  return (
    <div className={cn('mb-2.5 flex items-end justify-between gap-3 px-1', className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            onImage ? 'bg-yellow-300 text-[#0E3386]' : 'bg-primary/10 text-primary'
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h2
            id={id}
            className={cn(
              'truncate text-base font-extrabold uppercase tracking-wide leading-tight',
              titleColor
            )}
            style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.5px' }}
          >
            {title}
          </h2>
          {subtitle ? (
            <p className={cn('mt-0.5 text-[11px] font-medium leading-tight', subColor)}>{subtitle}</p>
          ) : null}
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
