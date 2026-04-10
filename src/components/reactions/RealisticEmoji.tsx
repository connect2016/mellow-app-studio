import { cn } from '@/lib/utils';

interface RealisticEmojiProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: 'h-5 w-5 sm:h-6 sm:w-6',
  sm: 'h-7 w-7 sm:h-8 sm:w-8',
  md: 'h-10 w-10 sm:h-12 sm:w-12',
  lg: 'h-14 w-14 sm:h-16 sm:w-16',
};

export function RealisticEmoji({ src, alt, size = 'sm', animate = false, className }: RealisticEmojiProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center flex-shrink-0',
        animate && 'animate-scale-in',
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn('object-contain rounded-full', SIZE_MAP[size])}
        draggable={false}
      />
    </div>
  );
}
