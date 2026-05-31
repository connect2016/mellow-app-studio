import { cn } from '@/lib/utils';

/**
 * Gold Season Ticket Holder star badge.
 * Overlay on the bottom-right of an avatar via `position: absolute` wrapper,
 * or render inline next to a name.
 */

const GOLD = '#FFC52C';
const GOLD_DEEP = '#D9A521';
const NAVY = '#0E3386';

interface STHBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

const SIZE_PX: Record<NonNullable<STHBadgeProps['size']>, number> = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
};

export function STHBadge({ size = 'sm', className, title = 'Season Ticket Holder' }: STHBadgeProps) {
  const px = SIZE_PX[size];
  return (
    <span
      aria-label={title}
      title={title}
      className={cn('inline-flex items-center justify-center rounded-full shadow-sm', className)}
      style={{
        width: px,
        height: px,
        background: `radial-gradient(circle at 30% 30%, ${GOLD} 0%, ${GOLD_DEEP} 80%)`,
        border: `1.5px solid ${NAVY}`,
        color: NAVY,
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={px * 0.6}
        height={px * 0.6}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2l2.95 6.74 7.05.59-5.36 4.77 1.64 7L12 17.27 5.72 21.1l1.64-7L2 9.33l7.05-.59L12 2z" />
      </svg>
    </span>
  );
}

interface AvatarWithSTHProps {
  src?: string | null;
  name?: string | null;
  isSTH?: boolean;
  size?: number; // px
  className?: string;
  ringColor?: string;
}

/**
 * Circular avatar with optional gold STH badge overlay on the bottom-right.
 */
export function AvatarWithSTH({
  src,
  name,
  isSTH,
  size = 48,
  className,
  ringColor = NAVY,
}: AvatarWithSTHProps) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  const badgeSize: STHBadgeProps['size'] =
    size <= 32 ? 'xs' : size <= 48 ? 'sm' : size <= 72 ? 'md' : 'lg';

  return (
    <span
      className={cn('relative inline-block shrink-0', className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={name ?? 'Fan avatar'}
          className="h-full w-full rounded-full object-cover"
          style={{ border: `2px solid ${ringColor}` }}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-full font-bold text-white"
          style={{ background: ringColor, border: `2px solid ${ringColor}`, fontSize: size * 0.4 }}
        >
          {initial}
        </span>
      )}
      {isSTH && (
        <STHBadge
          size={badgeSize}
          className="absolute -bottom-0.5 -right-0.5 ring-2 ring-background"
        />
      )}
    </span>
  );
}
