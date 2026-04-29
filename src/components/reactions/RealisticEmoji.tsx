/**
 * RealisticEmoji — kept for backwards compatibility but now renders
 * a clean ConceptIcon instead of an emoji image.
 *
 * Prefer using <ConceptIcon /> directly in new code.
 */

import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { cn } from '@/lib/utils';

interface RealisticEmojiProps {
  /** Concept name OR legacy image src/path. */
  src?: string;
  alt: string;
  /** Concept name (preferred). */
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: 'h-4 w-4 sm:h-5 sm:w-5',
  sm: 'h-5 w-5 sm:h-6 sm:w-6',
  md: 'h-7 w-7 sm:h-8 sm:w-8',
  lg: 'h-10 w-10 sm:h-12 sm:w-12',
};

export function RealisticEmoji({ name, src, alt, size = 'sm', animate = false, className }: RealisticEmojiProps) {
  // Best-effort key extraction from legacy image paths like "/src/assets/reactions/hotdog.png"
  let key = name;
  if (!key && src) {
    const m = src.match(/reactions\/([a-z0-9_-]+)\./i);
    key = m?.[1] ?? alt;
  }
  return (
    <ConceptIcon
      name={key ?? alt}
      aria-label={alt}
      className={cn(
        SIZE_MAP[size],
        animate && 'animate-scale-in',
        className,
      )}
    />
  );
}
