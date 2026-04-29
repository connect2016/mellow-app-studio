import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useScoringSessions } from '@/hooks/useScoringSession';
import { Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export function LiveScoringBanner() {
  const navigate = useNavigate();
  const { liveSessions } = useScoringSessions();

  const sessionCount = liveSessions.data?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl"></div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Score Together</p>
          <p className="text-xs text-muted-foreground">
            {sessionCount > 0
              ? `${sessionCount} live session${sessionCount !== 1 ? 's' : ''} — join fans scoring the game!`
              : 'Track the game with other Cubs fans in real time'}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/score')}
          className="rounded-xl gap-1"
        >
          {sessionCount > 0 ? 'Join' : 'Start'} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {sessionCount > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {liveSessions.data?.slice(0, 3).map(s => {
            const count = (s as any).scoring_session_members?.[0]?.count ?? 0;
            return (
              <button
                key={s.id}
                onClick={() => navigate(`/score/${s.id}`)}
                className="flex-shrink-0 rounded-xl border border-border bg-card px-3 py-2 text-left hover:border-primary/30 transition-all"
              >
                <p className="text-xs font-semibold text-foreground truncate max-w-[160px]">{s.title}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Users className="h-2.5 w-2.5" /> {count} fans
                </p>
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
