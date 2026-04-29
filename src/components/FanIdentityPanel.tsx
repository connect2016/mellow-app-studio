import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFanIdentity, FAN_TIERS, ARCHETYPE_LABELS, FanIdentity } from '@/hooks/useFanIdentity';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, RefreshCw, TrendingUp, Users, Sparkles, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

export function FanIdentityPanel() {
  const { currentIdentity, isLoading, classify } = useFanIdentity();
  const [result, setResult] = useState<FanIdentity | null>(null);

  const handleClassify = async () => {
    try {
      const res = await classify.mutateAsync();
      if (res.identity) {
        setResult(res.identity);
        toast.success(`$<ConceptVisual name={res.identity.emoji} size="sm" /> ${res.identity.title} — ${res.identity.tier.replace('_', ' ')}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to classify');
    }
  };

  const tier = result?.tier || currentIdentity?.fan_tier || 'rookie';
  const tierConf = FAN_TIERS[tier] || FAN_TIERS.rookie;
  const xp = result?.xp ?? currentIdentity?.fan_xp ?? 0;
  const title = result?.title || currentIdentity?.fan_title || 'Rookie Fan';
  const emoji = result?.emoji || currentIdentity?.fan_tier_emoji || '';
  const hasIdentity = currentIdentity?.fan_tier && currentIdentity.fan_tier !== 'rookie' || result;

  // XP progress to next tier
  const progressPct = Math.min(100, Math.max(0, ((xp - tierConf.minXp) / (tierConf.maxXp - tierConf.minXp + 1)) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Fan Identity
          </h3>
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/20 text-primary">
            AI-Ranked
          </Badge>
        </div>
        <button
          onClick={handleClassify}
          disabled={classify.isPending}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${classify.isPending ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="px-4 py-3">
        {classify.isPending ? (
          <div className="flex items-center gap-3 py-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 animate-pulse flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="h-3 w-28 bg-muted rounded animate-pulse mb-1.5" />
              <div className="h-2.5 w-44 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ) : hasIdentity ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={tier}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-3"
            >
              {/* Identity card */}
              <div className={`rounded-xl border p-3 ${tierConf.bg}`}>
                <div className="flex items-center gap-3">
                  <motion.span
                    className="text-3xl"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {emoji}
                  </motion.span>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-bold ${tierConf.color}`}>{title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="outline" className={`text-[9px] h-4 px-1.5 border-0 ${tierConf.bg}`}>
                        {tierConf.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{xp} XP</span>
                    </div>
                  </div>
                </div>

                {/* XP progress bar */}
                <div className="mt-2.5">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-muted-foreground">{tierConf.minXp} XP</span>
                    <span className="text-[9px] text-muted-foreground">{tierConf.maxXp + 1} XP</span>
                  </div>
                </div>
              </div>

              {/* Archetypes */}
              {result?.archetypes && result.archetypes.length > 0 && (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex gap-1.5 flex-wrap">
                    {result.archetypes.map(a => {
                      const arch = ARCHETYPE_LABELS[a];
                      return arch ? (
                        <span key={a} className="text-[10px] bg-muted/50 border border-border rounded-full px-2 py-0.5">
                          <ConceptVisual name={arch.emoji} size="sm" /> {arch.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Summary */}
              {result?.summary && (
                <p className="text-[11px] text-muted-foreground px-0.5">{result.summary}</p>
              )}

              {/* Next milestone */}
              {result?.next_milestone && (
                <div className="flex items-start gap-2 px-0.5">
                  <TrendingUp className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">Level up: </span>
                    {result.next_milestone}
                  </p>
                </div>
              )}

              {/* Match boost */}
              {result?.match_boost && (
                <div className="flex items-start gap-2 px-0.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">Best matched with: </span>
                    {result.match_boost}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-5">
            <span className="text-3xl"></span>
            <p className="text-sm text-muted-foreground mt-2">Discover your fan identity</p>
            <p className="text-xs text-muted-foreground mt-0.5">AI analyzes your full engagement history</p>
            <Button
              className="mt-3 rounded-xl gap-2 text-sm"
              size="sm"
              onClick={handleClassify}
              disabled={classify.isPending}
            >
              <Crown className="h-3.5 w-3.5" />
              {classify.isPending ? 'Analyzing...' : 'Reveal My Identity'}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Compact badge for profile cards
export function FanTierBadge({ tier, title, emoji }: { tier?: string | null; title?: string | null; emoji?: string | null }) {
  if (!tier || tier === 'rookie') return null;
  const conf = FAN_TIERS[tier] || FAN_TIERS.rookie;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${conf.bg}`}>
      <ConceptVisual name={emoji || conf.emoji} size="sm" />
      <span className={conf.color}>{title || conf.label}</span>
    </span>
  );
}
