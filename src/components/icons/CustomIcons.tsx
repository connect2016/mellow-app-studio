/**
 * Custom rounded-outline SVG icons for brand-critical concepts
 * where Lucide doesn't have a clean equivalent.
 *
 * All icons follow Lucide conventions:
 *   - 24x24 viewBox
 *   - stroke="currentColor"
 *   - strokeWidth defaults to 2 (override via prop)
 *   - rounded line caps & joins
 */

import { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export interface CustomIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string;
  strokeWidth?: number;
}

const baseProps = (size: number | string = 24, strokeWidth = 2, className?: string, rest?: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: cn('shrink-0', className),
  ...rest,
});

export function BaseballIcon({ size = 24, strokeWidth = 2, className, ...rest }: CustomIconProps) {
  return (
    <svg {...baseProps(size, strokeWidth, className, rest)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 7c2 1.4 3.2 3 3.6 5" />
      <path d="M5.5 17c2-1.4 3.2-3 3.6-5" />
      <path d="M18.5 7c-2 1.4-3.2 3-3.6 5" />
      <path d="M18.5 17c-2-1.4-3.2-3-3.6-5" />
    </svg>
  );
}

export function HotDogIcon({ size = 24, strokeWidth = 2, className, ...rest }: CustomIconProps) {
  return (
    <svg {...baseProps(size, strokeWidth, className, rest)}>
      <rect x="3" y="9" width="18" height="6" rx="3" />
      <path d="M5 11.5h14" />
      <path d="M5 12.5h14" />
    </svg>
  );
}

export function BeerMugIcon({ size = 24, strokeWidth = 2, className, ...rest }: CustomIconProps) {
  return (
    <svg {...baseProps(size, strokeWidth, className, rest)}>
      <path d="M6 4h9a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M17 8h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M8 8v9" />
      <path d="M12 8v9" />
    </svg>
  );
}

export function BearIcon({ size = 24, strokeWidth = 2, className, ...rest }: CustomIconProps) {
  return (
    <svg {...baseProps(size, strokeWidth, className, rest)}>
      <circle cx="12" cy="13" r="7" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="6.5" r="2.5" />
      <circle cx="9.5" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <path d="M10.5 16c.5.5 1 .8 1.5.8s1-.3 1.5-.8" />
    </svg>
  );
}

export function WFlagIcon({ size = 24, strokeWidth = 2, className, ...rest }: CustomIconProps) {
  return (
    <svg {...baseProps(size, strokeWidth, className, rest)}>
      <path d="M5 21V4" />
      <path d="M5 4h13l-2 4 2 4H5" />
      <path d="M9 7l1 4 1.5-3 1.5 3 1-4" />
    </svg>
  );
}

export function IvyIcon({ size = 24, strokeWidth = 2, className, ...rest }: CustomIconProps) {
  return (
    <svg {...baseProps(size, strokeWidth, className, rest)}>
      <path d="M12 21V8" />
      <path d="M12 12c-2-2-5-2-6-1 0 2 2 4 6 4" />
      <path d="M12 16c-2-2-5-2-6-1 0 2 2 4 6 4" />
      <path d="M12 12c2-2 5-2 6-1 0 2-2 4-6 4" />
      <path d="M12 8c-1-2-1-4 0-5 1 1 1 3 0 5Z" />
    </svg>
  );
}

export function ScoreboardIcon({ size = 24, strokeWidth = 2, className, ...rest }: CustomIconProps) {
  return (
    <svg {...baseProps(size, strokeWidth, className, rest)}>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M9 10v7" />
      <path d="M15 10v7" />
      <path d="M12 19v2" />
      <path d="M9 21h6" />
    </svg>
  );
}

export function HiFiveIcon({ size = 24, strokeWidth = 2, className, ...rest }: CustomIconProps) {
  return (
    <svg {...baseProps(size, strokeWidth, className, rest)}>
      <path d="M9 11V5a1.5 1.5 0 0 1 3 0v6" />
      <path d="M12 11V4a1.5 1.5 0 0 1 3 0v7" />
      <path d="M15 11V5.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-12 0v-3a1.5 1.5 0 0 1 3 0" />
    </svg>
  );
}

export function PeanutIcon({ size = 24, strokeWidth = 2, className, ...rest }: CustomIconProps) {
  return (
    <svg {...baseProps(size, strokeWidth, className, rest)}>
      <path d="M9 4c-3 0-5 2.5-5 5 0 1.5.7 2.7 1.7 3.5C4.7 13.3 4 14.5 4 16c0 2.5 2 4 5 4s5-1.5 5-4c0-1-.3-1.8-.8-2.5.5-.7.8-1.5.8-2.5 0-2.5-2-7-5-7Z" transform="translate(3 0) rotate(15 9 12)" />
    </svg>
  );
}
