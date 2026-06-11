import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { UserBaseballCard } from '@/components/UserBaseballCard';
import { TeammateProfile } from '@/hooks/useTeammates';
import { GameStatus, IntentType, GamedayIntentType } from '@/types';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonaBadge } from '@/components/PersonaBadge';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface TeammateDeckProps {
  teammates: TeammateProfile[];
  onCardClick?: (userId: string) => void;
}

/**
 * Tinder-style swipe deck.
 * - Top card is draggable horizontally; release past threshold sends it off-screen and advances.
 * - The next 2 cards stack behind with subtle scale/translate-y for depth.
 * - Royal Blue / White / Red Chicago palette frame + gloss texture overlay.
 */
export function TeammateDeck({ teammates, onCardClick }: TeammateDeckProps) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const remaining = teammates.slice(index);
  const visible = remaining.slice(0, 3);

  const onPointerDown = (e: React.PointerEvent) => {
    if (exitDir) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current || !drag.active) return;
    setDrag({
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
      active: true,
    });
  };

  const finishSwipe = useCallback((dir: 'left' | 'right') => {
    setExitDir(dir);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setDrag({ x: 0, y: 0, active: false });
      setExitDir(null);
    }, 280);
  }, []);

  const onPointerUp = (e: React.PointerEvent) => {
    cardRef.current?.releasePointerCapture?.(e.pointerId);
    if (!drag.active) return;
    const threshold = 120;
    if (drag.x > threshold) finishSwipe('right');
    else if (drag.x < -threshold) finishSwipe('left');
    else setDrag({ x: 0, y: 0, active: false });
    startRef.current = null;
  };

  const handleButtonSwipe = (dir: 'left' | 'right') => {
    if (exitDir || remaining.length === 0) return;
    finishSwipe(dir);
  };

  const handleReset = () => {
    setIndex(0);
    setDrag({ x: 0, y: 0, active: false });
    setExitDir(null);
  };

  if (remaining.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="text-6xl mb-3"></div>
        <h3 className="font-display text-xl font-bold text-white mb-1">End of the deck</h3>
        <p className="text-sm text-white/80 mb-5">You've flipped through every card on your roster.</p>
        <Button onClick={handleReset} variant="outline" className="rounded-xl gap-2">
          <RotateCcw className="h-4 w-4" /> Reshuffle deck
        </Button>
      </div>
    );
  }

  const rotation = drag.active || exitDir ? (exitDir === 'left' ? -25 : exitDir === 'right' ? 25 : drag.x / 18) : 0;
  const opacityOverlayLike = Math.max(0, drag.x / 150);
  const opacityOverlayPass = Math.max(0, -drag.x / 150);

  return (
    <div className="relative w-full">
      {/* Deck stage */}
      <div className="relative mx-auto w-full max-w-sm h-[560px] select-none">
        {visible
          .slice()
          .reverse()
          .map((t, revIdx) => {
            const stackPos = visible.length - 1 - revIdx; // 0 = top
            const isTop = stackPos === 0;
            const scale = 1 - stackPos * 0.04;
            const translateY = stackPos * 12;
            const baseTransform = `translateY(${translateY}px) scale(${scale})`;

            const topTransform =
              isTop
                ? exitDir
                  ? `translateX(${exitDir === 'left' ? '-130%' : '130%'}) rotate(${rotation}deg)`
                  : `translate(${drag.x}px, ${drag.y * 0.3}px) rotate(${rotation}deg)`
                : baseTransform;

            return (
              <div
                key={t.user_id + '-' + (index + stackPos)}
                ref={isTop ? cardRef : undefined}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? onPointerUp : undefined}
                onPointerCancel={isTop ? onPointerUp : undefined}
                className={cn(
                  'absolute inset-0 touch-none will-change-transform',
                  isTop ? 'cursor-grab active:cursor-grabbing z-30' : 'pointer-events-none',
                  isTop && exitDir ? 'transition-transform duration-300 ease-out' : '',
                  isTop && !drag.active && !exitDir ? 'transition-transform duration-200 ease-out' : ''
                )}
                style={{
                  transform: topTransform,
                  zIndex: 30 - stackPos,
                }}
              >
                <CardFrame teammate={t} onClick={isTop ? () => onCardClick?.(t.user_id) : undefined} />

                {/* "Like" / "Skip" stamps on top card while dragging */}
                {isTop && (
                  <>
                    <div
                      className="pointer-events-none absolute top-8 left-6 rotate-[-18deg] rounded-md border-4 border-[hsl(var(--brand-navy))] bg-white/90 px-4 py-1 text-2xl font-extrabold text-[hsl(var(--brand-navy))] shadow-xl"
                      style={{ opacity: opacityOverlayLike }}
                    >
                      KEEP
                    </div>
                    <div
                      className="pointer-events-none absolute top-8 right-6 rotate-[18deg] rounded-md border-4 border-[hsl(var(--brand-red))] bg-white/90 px-4 py-1 text-2xl font-extrabold text-[hsl(var(--brand-red))] shadow-xl"
                      style={{ opacity: opacityOverlayPass }}
                    >
                      NEXT
                    </div>
                  </>
                )}
              </div>
            );
          })}
      </div>

      {/* Counter + controls */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous card"
          onClick={() => handleButtonSwipe('left')}
          className="h-14 w-14 rounded-full border-2 border-[hsl(var(--brand-red))] text-[hsl(var(--brand-red))] bg-white/90 hover:bg-white shadow-lg"
        >
          <ChevronLeft className="h-7 w-7" />
        </Button>
        <div className="text-white font-display font-bold text-sm tracking-wider drop-shadow">
          {Math.min(index + 1, teammates.length)} / {teammates.length}
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next card"
          onClick={() => handleButtonSwipe('right')}
          className="h-14 w-14 rounded-full border-2 border-[hsl(var(--brand-navy))] text-[hsl(var(--brand-navy))] bg-white/90 hover:bg-white shadow-lg"
        >
          <ChevronRight className="h-7 w-7" />
        </Button>
      </div>
    </div>
  );
}

/** Single card with Royal Blue/White/Red trading-card frame, gloss overlay, and live status. */
function CardFrame({ teammate: t, onClick }: { teammate: TeammateProfile; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative h-full w-full overflow-hidden rounded-2xl shadow-2xl"
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--brand-navy)) 0%, #0a3a85 50%, hsl(var(--brand-navy)) 100%)',
        padding: '10px',
        border: '3px solid hsl(var(--brand-red))',
      }}
    >
      {/* Inner white frame */}
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-white">
        <div className="p-3 h-full flex flex-col">
          <UserBaseballCard
            profileImage={t.profile_photo}
            displayName={t.display_name}
            gameStatus={t.game_status as GameStatus}
            wrigleySection={t.wrigley_section}
            wrigleyvilleBar={t.wrigleyville_bar}
            intents={(t.intent as IntentType[]) ?? []}
            gamedayIntents={(t.gameday_intents as GamedayIntentType[]) ?? []}
            showReactions={false}
            isMatch
            className="max-w-full pointer-events-none"
          />

          {/* Persona + Live Vibe footer strip */}
          <div className="mt-auto pt-3 flex flex-wrap items-center justify-center gap-2">
            {t.gameday_persona && <PersonaBadge persona={t.gameday_persona} size="sm" />}
            {t.vibe_state && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--brand-red))] px-3 py-1 text-[11px] font-bold text-white shadow">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                {t.vibe_emoji ?? ''} {t.vibe_state}
              </span>
            )}
          </div>
        </div>

        {/* Trading-card gloss overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.05) 55%, transparent 70%)',
            mixBlendMode: 'overlay',
          }}
        />
        {/* Subtle paper texture via repeating gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #000 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, #000 0 1px, transparent 1px 3px)',
          }}
        />
      </div>
    </div>
  );
}
