import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin, Users, Clock, Utensils, Beer, Sparkles, Sun, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';
import {
  type CuratedBar, VIBE_LABELS, GROUP_LABELS, TIMING_LABELS,
} from '@/lib/wrigleyville-bar-guide';

interface Props {
  bar: CuratedBar;
  index: number;
  liveCheckins: number;
  liveCrowdLevel?: 'empty' | 'chill' | 'busy' | 'packed';
  liveVibe?: string;
  liveWait?: string;
  meetupCount: number;
  isEditorPick?: boolean;
  liveBeerCount?: number;
  onSendBeer?: (barName: string) => void;
}

const crowdConfig: Record<string, { label: string; emoji: string; color: string }> = {
  empty: { label: 'Quiet', emoji: '', color: 'bg-muted text-muted-foreground' },
  chill: { label: 'Chill', emoji: '', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  busy: { label: 'Buzzing', emoji: '', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  packed: { label: 'Packed', emoji: '', color: 'bg-red-500/15 text-red-700 dark:text-red-400' },
};

const accentBg: Record<string, string> = {
  'cubs-blue': 'from-blue-500/10 via-blue-400/5 to-transparent',
  red: 'from-red-500/10 via-red-400/5 to-transparent',
  amber: 'from-amber-500/10 via-amber-400/5 to-transparent',
};

const accentBar: Record<string, string> = {
  'cubs-blue': 'bg-blue-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
};

export function CuratedBarCard({ bar, index, liveCheckins, liveCrowdLevel, liveVibe, liveWait, meetupCount, isEditorPick, liveBeerCount, onSendBeer }: Props) {
  const [open, setOpen] = useState(false);
  const crowd = crowdConfig[liveCrowdLevel ?? 'empty'];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-sm transition-shadow"
    >
      {/* Accent gradient wash */}
      
      {/* Accent left bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentBar[bar.accent] || accentBar['cubs-blue']}`} />

      <div className="relative">
        {/* Editor's pick ribbon */}
        {isEditorPick && (
          <div className="absolute right-3 top-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-background">
              <Sparkles className="h-2.5 w-2.5" /> Editor's Pick
            </span>
          </div>
        )}

        {/* Header — title + tagline */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl leading-none"><ConceptVisual name={bar.emoji} size="sm" /></span>
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground leading-tight">
              {bar.name}
            </h2>
          </div>
          <p className="mt-1.5 text-[13px] italic text-muted-foreground leading-snug pl-8">
            "{bar.tagline}"
          </p>
        </div>

        {/* Live signals strip */}
        <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 border-0 ${crowd.color}`}>
            <ConceptVisual name={crowd.emoji} size="sm" /> {crowd.label}
          </Badge>
          {liveCheckins > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="font-semibold text-foreground">{liveCheckins}</span> checked in
            </span>
          )}
          {meetupCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold">
               {meetupCount} meetup{meetupCount !== 1 ? 's' : ''}
            </span>
          )}
          {liveBeerCount != null && liveBeerCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
               {liveBeerCount} beer{liveBeerCount !== 1 ? 's' : ''} sent
            </span>
          )}
          {liveWait && liveWait !== 'no_line' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" /> {liveWait.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Quick context strip */}
        <div className="px-5 pb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-background/60 border border-border/60 p-2.5">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" /> Walk
            </div>
            <div className="mt-0.5 text-[13px] font-bold text-foreground">
              {bar.blocksFromWrigley === 0 ? 'On corner' : `${bar.blocksFromWrigley} blk`}
            </div>
          </div>
          <div className="rounded-xl bg-background/60 border border-border/60 p-2.5">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <Beer className="h-2.5 w-2.5" /> Signature
            </div>
            <div className="mt-0.5 text-[13px] font-bold text-foreground truncate" title={bar.signature.drink}>
              {bar.signature.price}
            </div>
          </div>
          <div className="rounded-xl bg-background/60 border border-border/60 p-2.5">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <Utensils className="h-2.5 w-2.5" /> Food
            </div>
            <div className="mt-0.5 text-[13px] font-bold text-foreground">
              {bar.food === 'full-kitchen' ? 'Kitchen' : bar.food === 'bar-snacks' ? 'Snacks' : 'No food'}
            </div>
          </div>
        </div>

        {/* Vibe + best-for tag row */}
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {bar.vibe.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-foreground/5 border border-border px-2 py-0.5 text-[10px] font-semibold text-foreground">
              <ConceptVisual name={VIBE_LABELS[v].emoji} size="sm" /> {VIBE_LABELS[v].label}
            </span>
          ))}
          {bar.bestFor.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <ConceptVisual name={TIMING_LABELS[t].emoji} size="sm" /> {TIMING_LABELS[t].label}
            </span>
          ))}
          {bar.outdoor && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Sun className="h-2.5 w-2.5" /> Patio
            </span>
          )}
          {bar.rooftop && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-400">
              <Building2 className="h-2.5 w-2.5" /> Rooftop
            </span>
          )}
        </div>

        {/* Quick Beer CTA */}
        <div className="px-5 pb-3 flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1 h-9 rounded-xl gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-amber-950"
            onClick={(e) => {
              e.stopPropagation();
              if (onSendBeer) {
                onSendBeer(bar.name);
              }
            }}
            asChild={!onSendBeer}
          >
            {onSendBeer ? (
              <span><Beer className="h-3.5 w-3.5" /> Buy a Beer Here </span>
            ) : (
              <Link to={`/beer-money?bar=${encodeURIComponent(bar.name)}`}>
                <Beer className="h-3.5 w-3.5" /> Buy a Beer Here 
              </Link>
            )}
          </Button>
          <Button asChild size="sm" variant="outline" className="h-9 rounded-xl text-xs">
            <Link to={`/check-in?bar=${encodeURIComponent(bar.name)}`}>Check in</Link>
          </Button>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between border-t border-border/70 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          aria-expanded={open}
        >
          <span>{open ? 'Hide details' : 'Why fans love it · menu · specials'}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-border/70 bg-background/40"
            >
              <div className="px-5 py-4 space-y-3.5">
                {/* Editorial blurb */}
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">Why fans love it</div>
                  <p className="text-[13px] leading-relaxed text-foreground/90">{bar.whyFansLoveIt}</p>
                </div>

                {/* Signature */}
                <div className="rounded-xl bg-card border border-border p-3">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Signature drink</div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-3">
                    <span className="text-sm font-bold text-foreground">{bar.signature.drink}</span>
                    <span className="text-sm font-display font-bold text-primary">{bar.signature.price}</span>
                  </div>
                </div>

                {/* Menu */}
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Menu highlights</div>
                  <div className="flex flex-wrap gap-1.5">
                    {bar.menuHighlights.map((m) => (
                      <span key={m} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specials */}
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Specials</div>
                  <p className="text-[12px] leading-snug text-foreground/80">{bar.specials}</p>
                  <p className="text-[10px] italic text-muted-foreground mt-1">
                    Sample specials — partner bars coming soon
                  </p>
                </div>

                {/* Group fit + meta row */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-card border border-border p-2.5">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Best for groups</div>
                    <div className="mt-0.5 font-semibold text-foreground">
                      {bar.groupFit.map((g) => GROUP_LABELS[g].label).join(' · ')}
                    </div>
                  </div>
                  <div className="rounded-lg bg-card border border-border p-2.5">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Hours</div>
                    <div className="mt-0.5 font-semibold text-foreground">{bar.hours}</div>
                  </div>
                </div>

                {/* Footer / address */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-muted-foreground">
                     {bar.address} · est. {bar.established}
                  </div>
                </div>

                {/* CTAs */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Button asChild size="sm" variant="outline" className="h-9 text-xs">
                    <Link to={`/check-in?bar=${encodeURIComponent(bar.name)}`}>Check in</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="h-9 text-xs">
                    <Link to={`/meetups?venue=${encodeURIComponent(bar.name)}`}>Meetups</Link>
                  </Button>
                  <Button asChild size="sm" className="h-9 text-xs gap-1">
                    <Link to={`/beer-money?bar=${encodeURIComponent(bar.name)}`}>
                      <Beer className="h-3 w-3" /> Tip
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
