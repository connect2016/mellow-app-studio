import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RealisticEmojiProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: 'h-5 w-5',
  sm: 'h-7 w-7',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export function RealisticEmoji({ src, alt, size = 'sm', animate = false, className }: RealisticEmojiProps) {
  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
        transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
        className={cn('inline-flex items-center justify-center flex-shrink-0', className)}
      >
        <img src={src} alt={alt} loading="lazy" className={cn('object-contain rounded-full', SIZE_MAP[size])} draggable={false} />
      </motion.div>
    );
  }

  return (
    <div className={cn('inline-flex items-center justify-center flex-shrink-0', className)}>
      <img src={src} alt={alt} loading="lazy" className={cn('object-contain rounded-full', SIZE_MAP[size])} draggable={false} />
    </div>
  );
}
