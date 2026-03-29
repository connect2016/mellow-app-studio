import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSquadMatcher, useActivateSquad, type Squad } from '@/hooks/useSquadMatcher';
import { Sparkles, MapPin, Clock, Users, MessageCircle, Zap, RefreshCw, ChevronRight, Flame, Coffee, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SQUAD_TYPE_CONFIG = {
  party: { icon: Flame, label: 'Party Squad', color: 'hsl(var(--secondary))' },
  hardcore: { icon: Trophy, label: 'Hardcore Fans', color: 'hsl(var(--accent))' },
  chill: { icon: Coffee, label: 'Chill Crew', color: 'hsl(var(--lineup-teal))' },
};

function SquadCard({ squad, onActivate, isActivating }: { squad: Squad; onActivate: () => void; isActivating: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const config = SQUAD_TYPE_CONFIG[squad.squad_type] ?? SQUAD_TYPE_CONFIG.chill;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border transition-all ${
        expanded ? 'border-primary bg-primary/[0.03] shadow-sm' : 'border-border bg-background hover:border-primary/30'
      }`}
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-3">
        <div className="flex items-start gap-2.5">
          <span className="text-xl mt-0.5 shrink-0">{squad.vibe_emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground leading-snug" style={{ fontFamily: 'Barlow Condensed' }}>
                {squad.squad_name}
              </p>
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white"
                style={{ background: config.color }}
              >
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Users className="h-3 w-3" /> {squad.members.length}
              </span>
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" /> {squad.meeting_point}
              </span>
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" /> {squad.meeting_time}
              </span>
            </div>

            {/* Avatar row */}
            <div className="flex items-center gap-1 mt-2">
              <div className="flex -space-x-2">
                {squad.members.slice(0, 5).map((m, i) => (
                  <div
                    key={m.id}
                    className={`h-7 w-7 rounded-full border-2 overflow-hidden shrink-0 ${
                      m.isMe ? 'border-primary' : 'border-white'
                    } bg-muted`}
                  >
                    {m.photo ? (
                      <img src={m.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                        {m.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {squad.members.length > 5 && (
                <span className="text-[10px] text-muted-foreground">+{squad.members.length - 5}</span>
              )}
              {squad.members.some(m => m.isMe) && (
                <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full ml-1">
                  You're in!
                </span>
              )}
            </div>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Why this squad */}
              <p className="text-xs text-muted-foreground">{squad.reason}</p>

              {/* Members detail */}
              <div className="space-y-1.5">
                {squad.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    <div className={`h-6 w-6 rounded-full overflow-hidden bg-muted shrink-0 ${m.isMe ? 'ring-1 ring-primary' : ''}`}>
                      {m.photo ? (
                        <img src={m.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                          {m.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-foreground">
                      {m.isMe ? 'You' : m.name}
                    </span>
                    {m.fanStyle?.length > 0 && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        · {m.fanStyle.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Icebreaker */}
              <div className="rounded-lg bg-muted/50 border border-border p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> Auto-chat icebreaker
                </p>
                <p className="text-xs text-foreground italic">"{squad.icebreaker}"</p>
              </div>

              {/* Activate button */}
              <Button
                size="sm"
                className="w-full rounded-xl gap-1.5 font-bold"
                style={{ background: 'hsl(var(--lineup-teal))' }}
                disabled={isActivating}
                onClick={(e) => {
                  e.stopPropagation();
                  onActivate();
                }}
              >
                <Zap className="h-3.5 w-3.5" />
                {isActivating ? 'Creating Squad...' : 'Activate Squad & Start Chat'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function SquadMatcherPanel() {
  const { data, isLoading, isError, refetch, isFetching } = useSquadMatcher();
  const activateSquad = useActivateSquad();

  const squads = data?.squads ?? [];
  const totalFans = data?.totalFans ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="h-4 w-4 text-primary" />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0"
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
          </div>
          <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'Barlow Condensed' }}>
            AI Squad Matcher
          </h3>
          {totalFans > 0 && (
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {totalFans} fans scanned
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          Rematch
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {isLoading ? (
          <div className="py-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="inline-block"
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </motion.div>
            <p className="mt-2 text-xs text-muted-foreground font-medium">
              AI is finding your perfect squad...
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Analyzing vibes, proximity & activity
            </p>
          </div>
        ) : isError ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Couldn't find squads right now</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2 text-xs">
              Try again
            </Button>
          </div>
        ) : squads.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-2xl">🏟️</p>
            <p className="mt-1 text-sm text-muted-foreground">Not enough fans nearby for squads</p>
            <p className="text-xs text-muted-foreground">Check back during game time!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {squads.map((squad, i) => (
              <SquadCard
                key={`${squad.squad_name}-${i}`}
                squad={squad}
                onActivate={() => activateSquad.mutate(squad)}
                isActivating={activateSquad.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
