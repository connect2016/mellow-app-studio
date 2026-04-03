import { useIvyLeafAllTimeCount } from '@/hooks/useIvyLeaves';
import { motion } from 'framer-motion';

interface IvyLeafBadgeProps {
  userId?: string;
  size?: 'sm' | 'md';
}

export function IvyLeafBadge({ userId, size = 'sm' }: IvyLeafBadgeProps) {
  const { data: total = 0 } = useIvyLeafAllTimeCount(userId);

  if (total === 0) return null;

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-900/40 font-bold text-emerald-300 backdrop-blur-sm ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      }`}
    >
      <span>🌿</span>
      <span>{total}</span>
    </motion.span>
  );
}
