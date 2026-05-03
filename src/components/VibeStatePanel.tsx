import { IconButton } from '@/components/ui/IconButton';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVibeState, VIBE_STATES } from '@/hooks/useVibeState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Zap, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

export function VibeStatePanel() {
  const { currentVibe, vibeLoading, classify } = useVibeState();
  const [result, setResult] = useState<any>(null);

  const vibeKey = currentVibe?.vibe_state || 'unknown';
  const conf = VIBE_STATES[vibeKey] || VIBE_STATES.unknown;
  const isStale = !currentVibe?.vibe_state_updated_at ||
    Date.now() - new Date(currentVibe.vibe_state_updated_at).getTime() > 30 * 60 * 1000;

  const handleClassify = async () => {
    try {
      const res = await classify.mutateAsync();
      if (res.vibe) {
        setResult(res.vibe);
        toast.success(`Vibe updated: $<ConceptVisual name={res.vibe.emoji} size="sm" /> ${VIBE_STATES[res.vibe.vibe_state]?.label || res.vibe.vibe_state}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to classify vibe');
    }
  };

  const displayVibe = result || (currentVibe ? {
    vibe_state: currentVibe.vibe_state,
    emoji: currentVibe.vibe_emoji,
    reason: null,
    energy_level: null,
    match_tip: null,
  } : null);

  const displayConf = displayVibe ? (VIBE_STATES[displayVibe.vibe_state] || VIBE_STATES.unknown) : VIBE_STATES.unknown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Your Vibe
          </h3>
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/20 text-primary">
            AI-Classified
          </Badge>
        </div>
        <IconButton
          onClick={handleClassify}
          disabled={classify.isPending}
          aria-label="Refresh vibe"
          className="text-muted-foreground hover:text-foreground"
          icon={<RefreshCw className={`h-3.5 w-3.5 ${classify.isPending ? 'animate-spin' : ''}`} />}
        />
      </div>

      <div className="px-4 py-3">
        {classify.isPending ? (
          <div className="flex items-center gap-3 py-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 animate-pulse flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="h-3 w-28 bg-muted rounded animate-pulse mb-1.5" />
              <div className="h-2.5 w-44 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ) : displayVibe && displayVibe.vibe_state !== 'unknown' ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={displayVibe.vibe_state}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="space-y-3"
            >
              {/* Vibe card */}
              <div className={`rounded-xl border p-3 ${displayConf.bg}`}>
                <div className="flex items-center gap-3">
                  <motion.span
                    className="text-3xl"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ConceptVisual name={displayVibe.emoji} size="sm" />
                  </motion.span>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${displayConf.color}`}>{displayConf.label}</p>
                    {displayVibe.reason && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{displayVibe.reason}</p>
                    )}
                  </div>
                  {displayVibe.energy_level && (
                    <div className="flex flex-col items-center">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all ${
                              i < displayVibe.energy_level
                                ? `${displayConf.color.replace('text-', 'bg-')} h-${Math.min(3 + Math.floor(i / 3), 5)}`
                                : 'bg-muted h-2'
                            }`}
                            style={{ height: i < displayVibe.energy_level ? `${8 + i * 1.5}px` : '6px' }}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-1">Energy</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Match tip */}
              {displayVibe.match_tip && (
                <div className="flex items-start gap-2 px-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground">{displayVibe.match_tip}</p>
                </div>
              )}

              {isStale && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5"
                  onClick={handleClassify}
                  disabled={classify.isPending}
                >
                  <Zap className="h-3 w-3" /> Refresh My Vibe
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-5">
            <span className="text-3xl"></span>
            <p className="text-sm text-muted-foreground mt-2">What's your vibe right now?</p>
            <Button
              className="mt-3 rounded-xl gap-2 text-sm"
              size="sm"
              onClick={handleClassify}
              disabled={classify.isPending}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {classify.isPending ? 'Classifying...' : 'Discover My Vibe'}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Small inline badge for use on profile cards
export function VibeStateBadge({ vibeState, vibeEmoji }: { vibeState?: string | null; vibeEmoji?: string | null }) {
  if (!vibeState || vibeState === 'unknown') return null;
  const conf = VIBE_STATES[vibeState] || VIBE_STATES.unknown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${conf.bg}`}>
      <ConceptVisual name={vibeEmoji || conf.emoji} size="sm" />
      <span className={conf.color}>{conf.label}</span>
    </span>
  );
}
