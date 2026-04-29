import { useLeaderboard, useCurrentHomestand } from '@/hooks/useIvyLeaves';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const RANK_STYLES: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-amber-600',
};

export function HallOfFameLeaderboard() {
  const { data: homestand } = useCurrentHomestand();
  const { data: leaders = [], isLoading } = useLeaderboard();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/80 backdrop-blur-md overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Hall of Fame
          </h3>
        </div>
        {homestand && (
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {homestand.name}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {isLoading ? (
          <div className="py-6 text-center">
            <p className="text-2xl animate-pulse"><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></p>
            <p className="text-xs text-muted-foreground mt-1">Loading leaders...</p>
          </div>
        ) : !homestand ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No active homestand right now</p>
            <p className="text-xs text-muted-foreground mt-1">Leaderboard resets each homestand</p>
          </div>
        ) : leaders.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-2xl"><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></p>
            <p className="text-sm font-semibold text-muted-foreground mt-1">Be the first to earn Ivy Leaves!</p>
            <p className="text-xs text-muted-foreground mt-0.5">Check in, join squads, or meet a buddy</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {leaders.map((leader, i) => (
              <motion.button
                key={leader.userId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/profile/${leader.userId}`)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted/40 transition-colors"
              >
                {/* Rank */}
                <span className={`w-5 text-center font-extrabold text-sm ${RANK_STYLES[leader.rank] ?? 'text-muted-foreground'}`}
                  style={{ fontFamily: "'Courier Prime', monospace" }}
                >
                  {leader.rank}
                </span>

                {/* Avatar */}
                <div className="h-8 w-8 rounded-full overflow-hidden bg-muted ring-2 ring-border flex-shrink-0">
                  {leader.photo ? (
                    <img src={leader.photo} alt={leader.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {leader.displayName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Name */}
                <span className="flex-1 text-left text-sm font-semibold text-foreground truncate">
                  {leader.displayName}
                </span>

                {/* Ivy count */}
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                  <span><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span> {leader.total}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
