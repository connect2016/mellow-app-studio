import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Radio, Calendar } from 'lucide-react';
import { useMlbCubsGame, type CubsLiveGame } from '@/hooks/useMlbCubsGame';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

function useCountdown(target?: string) {
  const [diffMs, setDiffMs] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    const tick = () => setDiffMs(new Date(target).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  if (diffMs === null) return null;
  const total = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return { hours, mins, secs, totalMs: diffMs };
}

function CountdownDigits({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="font-display text-3xl font-extrabold tabular-nums leading-none text-foreground">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function BasesDiamond({ first, second, third }: { first?: boolean; second?: boolean; third?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden>
      <g transform="translate(20 20) rotate(45)">
        <rect x="-12" y="-12" width="8" height="8" fill={third ? 'hsl(var(--primary))' : 'transparent'} stroke="currentColor" strokeWidth="1.5" />
        <rect x="-4" y="-12" width="8" height="8" fill={second ? 'hsl(var(--primary))' : 'transparent'} stroke="currentColor" strokeWidth="1.5" />
        <rect x="4" y="-12" width="8" height="8" fill={first ? 'hsl(var(--primary))' : 'transparent'} stroke="currentColor" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function LiveScoreCard({ game }: { game: CubsLiveGame }) {
  const cubs = game.cubsScore ?? 0;
  const opp = game.opponentScore ?? 0;
  const winning = cubs > opp;
  const tied = cubs === opp;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="rounded-full bg-[#C8102E] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Live</span>
          {game.inning && (
            <span className="ml-1 text-[10px] font-semibold text-muted-foreground">
              {game.inningHalf === 'Top' ? '▲' : game.inningHalf === 'Bottom' ? '▼' : ''} {game.inning}
            </span>
          )}
        </div>
        {(game.balls !== undefined && game.strikes !== undefined && game.outs !== undefined) && (
          <div className="text-[10px] font-mono font-bold text-muted-foreground">
            {game.balls}-{game.strikes} · {game.outs} {game.outs === 1 ? 'OUT' : 'OUTS'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CUBS</div>
          <div className={`font-display text-5xl font-extrabold tabular-nums leading-none ${winning ? 'text-primary' : tied ? 'text-foreground' : 'text-muted-foreground'}`}>
            {cubs}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-foreground">
          <BasesDiamond first={game.onFirst} second={game.onSecond} third={game.onThird} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">vs</span>
        </div>
        <div className="text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{game.opponentAbbr || 'OPP'}</div>
          <div className={`font-display text-5xl font-extrabold tabular-nums leading-none ${!winning && !tied ? 'text-primary' : tied ? 'text-foreground' : 'text-muted-foreground'}`}>
            {opp}
          </div>
        </div>
      </div>

      {game.lastPlay && (
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-snug text-foreground/80">
          <span className="font-bold text-primary">Last:</span> {game.lastPlay}
        </div>
      )}
    </div>
  );
}

function FinalCard({ game }: { game: CubsLiveGame }) {
  const cubs = game.cubsScore ?? 0;
  const opp = game.opponentScore ?? 0;
  const won = cubs > opp;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Final</span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${won ? 'text-emerald-500' : 'text-muted-foreground'}`}>
          {won ? '· W' : '· L'}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CUBS</div>
          <div className={`font-display text-5xl font-extrabold tabular-nums leading-none ${won ? 'text-primary' : 'text-muted-foreground'}`}>{cubs}</div>
        </div>
        <span className="text-xs font-bold text-muted-foreground">FINAL</span>
        <div className="text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{game.opponentAbbr || 'OPP'}</div>
          <div className={`font-display text-5xl font-extrabold tabular-nums leading-none ${!won ? 'text-primary' : 'text-muted-foreground'}`}>{opp}</div>
        </div>
      </div>
    </div>
  );
}

function CountdownCard({ game }: { game: CubsLiveGame }) {
  const cd = useCountdown(game.gameDate);
  if (!cd) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">First Pitch</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{game.homeAway === 'home' ? 'vs' : '@'} {game.opponentAbbr}</span>
      </div>
      <div className="flex items-center justify-center gap-4">
        <CountdownDigits value={cd.hours} label="hrs" />
        <span className="font-display text-3xl font-extrabold text-muted-foreground/40">:</span>
        <CountdownDigits value={cd.mins} label="min" />
        <span className="font-display text-3xl font-extrabold text-muted-foreground/40">:</span>
        <CountdownDigits value={cd.secs} label="sec" />
      </div>
      {(game.probablePitcherCubs || game.probablePitcherOpponent) && (
        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          {game.probablePitcherCubs && (
            <span> {game.probablePitcherCubs}</span>
          )}
          <span className="text-muted-foreground/40">vs</span>
          {game.probablePitcherOpponent && (
            <span>{game.probablePitcherOpponent}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function LiveGameHeader() {
  const { data: game, isLoading } = useMlbCubsGame();

  if (isLoading || !game) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="h-20 animate-pulse rounded bg-muted/40" />
      </div>
    );
  }

  if (game.status === 'no-game') return null;

  if (game.status === 'postponed') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-center">
        <Radio className="mx-auto mb-2 h-5 w-5 text-amber-600" />
        <div className="font-bold text-foreground">Game postponed</div>
        <div className="mt-1 text-xs text-muted-foreground">vs {game.opponentAbbr || game.opponent}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      {/* Subtle ivy gradient accent */}
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative">
        {game.status === 'live' && <LiveScoreCard game={game} />}
        {game.status === 'final' && <FinalCard game={game} />}
        {(game.status === 'scheduled' || game.status === 'pre-game') && <CountdownCard game={game} />}
      </div>
    </motion.div>
  );
}
