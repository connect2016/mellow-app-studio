import { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, ArrowRightLeft, Copy, Users } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface MemberProfile {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
}

interface RelayPanelProps {
  sessionId: string;
  inviteCode?: string | null;
  activeScorerId?: string | null;
  members: MemberProfile[];
  userId?: string;
  onPassPencil: (toUserId: string) => void;
  activeBatter: number;
  currentInning?: number;
}

export function RelayPanel({ sessionId, inviteCode, activeScorerId, members, userId, onPassPencil, activeBatter, currentInning = 1 }: RelayPanelProps) {
  const [pencilTarget, setPencilTarget] = useState<string | null>(null);
  const [travelAnim, setTravelAnim] = useState<{ fromX: number; fromY: number; toX: number; toY: number } | null>(null);
  const avatarRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const isActiveScorer = activeScorerId === userId;
  const activeScorer = members.find(m => m.user_id === activeScorerId);

  const copyInvite = () => {
    const link = `${window.location.origin}/score/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast(' Link copied!', { description: 'Share with friends to co-score' });
  };

  const copyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    toast(' Code copied!', { description: inviteCode });
  };

  const handlePassPencil = (toUserId: string) => {
    // Calculate travel animation coordinates
    const fromEl = activeScorerId ? avatarRefs.current[activeScorerId] : null;
    const toEl = avatarRefs.current[toUserId];
    const container = containerRef.current;

    if (fromEl && toEl && container) {
      const cRect = container.getBoundingClientRect();
      const fRect = fromEl.getBoundingClientRect();
      const tRect = toEl.getBoundingClientRect();
      setTravelAnim({
        fromX: fRect.left - cRect.left + fRect.width / 2,
        fromY: fRect.top - cRect.top,
        toX: tRect.left - cRect.left + tRect.width / 2,
        toY: tRect.top - cRect.top,
      });
    }

    setPencilTarget(toUserId);
    const target = members.find(m => m.user_id === toUserId);
    onPassPencil(toUserId);

    // Spec toast: "You've got the pencil! Scoring Inning X."
    toast(` ${target?.display_name ?? 'Co-scorer'} has the pencil!`, {
      description: `Scoring Inning ${currentInning}.`,
    });

    // Reset animation states
    setTimeout(() => {
      setPencilTarget(null);
      setTravelAnim(null);
    }, 900);
  };

  return (
    <div className="space-y-4">
      {/* Invite Section */}
      <div className="rounded-2xl border-2 p-4 space-y-3" style={{ borderColor: 'hsl(var(--ivy-green) / 0.2)', backgroundColor: '#F9F8F4' }}>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: 'hsl(var(--ivy-green))' }} />
          <span className="text-sm font-bold font-['Graduate']" style={{ color: 'hsl(var(--ivy-green))' }}>
            Invite Co-Scorers
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyInvite}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold border-2 transition-all"
            style={{ borderColor: 'hsl(var(--accent) / 0.3)', color: 'hsl(var(--accent))', fontFamily: "'Legend M54', 'Bebas Neue', sans-serif" }}
          >
             Share Link
          </button>
          {inviteCode && (
            <button
              onClick={copyCode}
              className="flex items-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold border-2"
              style={{ borderColor: 'hsl(var(--ivy-green) / 0.3)', fontFamily: "'Legend M54', 'Bebas Neue', sans-serif" }}
            >
              <Copy className="h-3 w-3" />
              <code className="font-mono">{inviteCode}</code>
            </button>
          )}
        </div>
      </div>

      {/* Active Scorer with pencil indicator */}
      <div className="rounded-2xl border-2 p-4 space-y-3" style={{ borderColor: 'hsl(var(--ivy-green) / 0.2)', backgroundColor: '#F9F8F4' }}>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <Pencil className="h-4 w-4" style={{ color: 'hsl(var(--secondary))' }} />
          </motion.div>
          <span className="text-sm font-bold font-['Graduate']" style={{ color: 'hsl(var(--ivy-green))' }}>
            The Pencil
          </span>
        </div>

        {/* Active scorer display with pencil badge + travel animation */}
        <div className="relative" ref={containerRef}>
          <div className="flex items-center gap-3">
            {members.map(m => {
              const isActive = m.user_id === activeScorerId;
              const isTarget = m.user_id === pencilTarget;
              return (
                <motion.div
                  key={m.user_id}
                  className="relative"
                  ref={(el) => { avatarRefs.current[m.user_id] = el; }}
                  animate={isTarget ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <Avatar className={`h-10 w-10 border-2 transition-all ${isActive ? 'ring-2 ring-offset-1' : ''}`}
                    style={{
                      borderColor: isActive ? 'hsl(var(--ivy-green))' : 'transparent',
                      opacity: isActive ? 1 : 0.5,
                      boxShadow: isActive ? '0 0 0 2px hsl(var(--secondary) / 0.4)' : 'none',
                    }}
                  >
                    <AvatarImage src={m.profile_photo ?? undefined} />
                    <AvatarFallback className="text-xs font-bold">{m.display_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {/* Pencil badge on active scorer (hidden during travel) */}
                  <AnimatePresence>
                    {isActive && !travelAnim && (
                      <motion.div
                        initial={{ scale: 0, y: 5 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0, x: 20 }}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: 'hsl(var(--secondary))' }}
                      >
                        <Pencil className="h-2.5 w-2.5 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <p className="text-[8px] text-center mt-0.5 font-['Legend_M54'] truncate max-w-[48px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {m.display_name.split(' ')[0]}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Travelling pencil animation */}
          <AnimatePresence>
            {travelAnim && (
              <motion.div
                initial={{ x: travelAnim.fromX - 10, y: travelAnim.fromY - 8, scale: 1, opacity: 1 }}
                animate={{ x: travelAnim.toX - 10, y: travelAnim.toY - 8, scale: [1, 1.4, 1], opacity: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute z-20 h-5 w-5 rounded-full flex items-center justify-center shadow-lg pointer-events-none"
                style={{ backgroundColor: 'hsl(var(--secondary))' }}
              >
                <Pencil className="h-2.5 w-2.5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {activeScorer && (
          <div className="flex items-center gap-2 rounded-xl p-2.5" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.06)' }}>
            <p className="text-xs font-bold flex-1" style={{ color: 'hsl(var(--foreground))' }}>
              {isActiveScorer ? ' You have the pencil' : ` ${activeScorer.display_name} is scoring`}
            </p>
            <span className="text-[10px] font-['Legend_M54'] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--accent) / 0.1)', color: 'hsl(var(--accent))' }}>
              Batter #{activeBatter}
            </span>
          </div>
        )}
        {!activeScorer && (
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No active scorer — anyone can score</p>
        )}

        {/* Pass Pencil buttons with slide animation */}
        {isActiveScorer && members.length > 1 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider font-['Legend_M54']" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Pass the Pencil to:
            </p>
            {members.filter(m => m.user_id !== userId).map((m, i) => (
              <motion.button
                key={m.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePassPencil(m.user_id)}
                className="w-full flex items-center gap-3 rounded-xl p-2.5 border-2 transition-all hover:border-[hsl(var(--ivy-green)/0.4)]"
                style={{ borderColor: 'hsl(var(--ivy-green) / 0.15)', backgroundColor: '#FDFCF8' }}
              >
                <Avatar className="h-7 w-7 border" style={{ borderColor: 'hsl(var(--ivy-green) / 0.2)' }}>
                  <AvatarImage src={m.profile_photo ?? undefined} />
                  <AvatarFallback className="text-[8px] font-bold">{m.display_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold flex-1 text-left">{m.display_name}</span>
                <motion.div whileHover={{ x: 3 }} className="flex items-center gap-1">
                  <Pencil className="h-3 w-3" style={{ color: 'hsl(var(--secondary))' }} />
                  <ArrowRightLeft className="h-3 w-3" style={{ color: 'hsl(var(--ivy-green))' }} />
                </motion.div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
