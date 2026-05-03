import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wind, Trophy, Users, Plus } from 'lucide-react';
import { useMlbCubsGame } from '@/hooks/useMlbCubsGame';
import { useWrigleyWeather } from '@/hooks/useWrigleyWeather';
import { Button } from '@/components/ui/button';
import { CreateMeetupModal } from '@/components/lineup/CreateMeetupModal';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

function useCountdown(targetIso?: string) {
  const target = useMemo(() => (targetIso ? new Date(targetIso).getTime() : 0), [targetIso]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const diff = target - now;
  if (diff <= 0) return { h: 0, m: 0, s: 0, done: true };
  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
    done: false,
  };
}

export function GameDayBanner() {
  const { data: game } = useMlbCubsGame();
  const { data: weather } = useWrigleyWeather();
  const countdown = useCountdown(game?.gameDate);
  const [showCreate, setShowCreate] = useState(false);

  if (!game || game.status === 'no-game' || game.status === 'postponed') return null;

  const isLive = game.status === 'live' || game.status === 'pre-game';
  const isFinal = game.status === 'final';

  const headline = isLive
    ? `Live · ${game.inningHalf ?? ''} ${game.inning ?? ''}`.trim()
    : isFinal
      ? 'Final'
      : 'First pitch in';

  const opponentLabel = game.opponent
    ? `${game.homeAway === 'home' ? 'vs' : '@'} ${game.opponent}`
    : 'Cubs game today';

  return (
    <>
      <section
        aria-label="Game Day"
        className="mx-3 mt-3 mb-2 overflow-hidden rounded-2xl border border-yellow-300/40 shadow-lg"
        style={{
          background:
            'linear-gradient(135deg, hsl(220, 75%, 18%) 0%, hsl(220, 80%, 28%) 60%, hsl(0, 70%, 35%) 100%)',
        }}
      >
        {/* Header strip */}
        <div className="flex items-center justify-between gap-2 px-4 pt-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-300 text-brand-blue">
              <Trophy className="h-3.5 w-3.5" strokeWidth={2.75} />
            </span>
            <span
              className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-yellow-300"
              style={{ fontFamily: 'Norwester, sans-serif' }}
            >
              Game Day Mode
            </span>
            {isLive && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Live
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-white/80">{opponentLabel}</span>
        </div>

        {/* Countdown / Score row */}
        <div className="px-4 pt-2 pb-3">
          {isLive || isFinal ? (
            <div className="flex items-baseline gap-3">
              <div
                className="text-3xl font-extrabold leading-none text-white"
                style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.02em' }}
              >
                {game.cubsScore ?? 0} – {game.opponentScore ?? 0}
              </div>
              <div className="text-xs font-bold uppercase text-yellow-200">{headline}</div>
            </div>
          ) : (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-200/90">
                {headline}
              </div>
              <div
                className="mt-0.5 flex items-baseline gap-1 text-white"
                style={{ fontFamily: 'Norwester, sans-serif' }}
              >
                {countdown ? (
                  <>
                    <span className="text-3xl font-extrabold leading-none tabular-nums">
                      {String(countdown.h).padStart(2, '0')}
                    </span>
                    <span className="text-xl font-bold text-yellow-200">:</span>
                    <span className="text-3xl font-extrabold leading-none tabular-nums">
                      {String(countdown.m).padStart(2, '0')}
                    </span>
                    <span className="text-xl font-bold text-yellow-200">:</span>
                    <span className="text-3xl font-extrabold leading-none tabular-nums">
                      {String(countdown.s).padStart(2, '0')}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold">—</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Weather + wind */}
        {weather && (
          <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2 ring-1 ring-white/15">
            <span className="text-2xl leading-none"><ConceptVisual name={weather.emoji} size="sm" /></span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-lg font-extrabold text-white"
                  style={{ fontFamily: 'Norwester, sans-serif' }}
                >
                  {Math.round(weather.temperatureF)}°F
                </span>
                <span className="text-[11px] font-semibold text-white/80 truncate">
                  {weather.weatherSummary}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-yellow-200">
                <Wind className="h-3 w-3" />
                {Math.round(weather.windMph)} mph {weather.windDirection} ·{' '}
                <span className="uppercase tracking-wide">{weather.windRelativeToField}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          <Button
            asChild
            className="min-h-[48px] gap-1.5 rounded-xl bg-white text-brand-blue hover:bg-white/90 font-bold text-[13px] shadow"
          >
            <Link to="/score">
              <Users className="h-4 w-4" />
              Score with a Friend
            </Link>
          </Button>
          <Button
            onClick={() => setShowCreate(true)}
            className="min-h-[48px] gap-1.5 rounded-xl bg-yellow-300 text-brand-blue hover:bg-yellow-200 font-bold text-[13px] shadow"
          >
            <Plus className="h-4 w-4" />
            Create a Meetup
          </Button>
        </div>
      </section>
      <CreateMeetupModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
