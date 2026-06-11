import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, Tv, ExternalLink, ChevronDown, Sparkles, X, MessageSquare,
  ArrowLeft, Filter,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/AppHeader';
import { SEOMeta } from '@/components/SEOMeta';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { GuestBanner } from '@/components/GuestBanner';
import { EatsCheckInButton } from '@/components/eats/EatsCheckInButton';
import { BleacherBarometer } from '@/components/eats/BleacherBarometer';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';
import {
  FOOD_SPOTS,
  CATEGORY_META,
  TAG_META,
  PHASE_META,
  type FoodCategory,
  type FoodTag,
  type GameDayPhase,
  type FoodSpot,
} from '@/lib/wrigleyville-eats';

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as FoodCategory[];
const POPULAR_TAGS: FoodTag[] = ['bbq', 'pizza', 'tacos', 'burgers', 'wings', 'brunch', 'coffee', 'late-night', 'dog-friendly', 'outdoor'];

export default function WrigleyvilleEats() {
  const { isGuest } = useGuestMode();
  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState<FoodCategory[]>([]);
  const [activeTags, setActiveTags] = useState<FoodTag[]>([]);
  const [phase, setPhase] = useState<GameDayPhase>('before');
  const [showSuggest, setShowSuggest] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleCat = (c: FoodCategory) =>
    setActiveCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  const toggleTag = (t: FoodTag) =>
    setActiveTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  const clearAll = () => { setActiveCategories([]); setActiveTags([]); setSearch(''); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return FOOD_SPOTS.filter((s) => {
      if (activeCategories.length && !activeCategories.includes(s.category)) return false;
      if (activeTags.length && !activeTags.some((t) => s.tags.includes(t))) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.tags.some((t) => TAG_META[t].label.toLowerCase().includes(q)) && !s.fanTip.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, activeCategories, activeTags]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => a.walkMinutes - b.walkMinutes),
    [filtered],
  );

  const activeFilterCount = activeCategories.length + activeTags.length + (search ? 1 : 0);

  const openInMaps = (spot: FoodSpot) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
    window.open(url, '_blank', 'noopener');
  };

  return (
    <div className={`min-h-screen bg-background ${isGuest ? 'pb-20' : 'pb-24'}`}>
      <SEOMeta
        title="Wrigleyville Eats — Cubs Game-Day Food Guide"
        description="Best restaurants and food spots in Wrigleyville for before, during, and after the Cubs game. Pizza, BBQ, tacos, brunch, and late-night picks."
        url="/eats"
      />
      <AppHeader />

      {/* Hero */}
      <header className="px-4 pt-6 pb-4 max-w-3xl mx-auto">
        <Link to="/bar-map" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Bar Guide
        </Link>

        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="h-3 w-3" /> Curated · Wrigleyville
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight leading-none text-foreground">
          Wrigleyville
          <br />
          <span className="text-primary">Eats & Drinks</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-prose">
          The best food and drink spots around the Friendly Confines — from late-night dogs
          to sit-down date spots. Curated by fans, for fans.
        </p>
      </header>

      {/* Search */}
      <div className="max-w-3xl mx-auto px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, food type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl bg-card/60 border-border"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Game Day Phase Toggle */}
      <div className="max-w-3xl mx-auto px-4 mb-3">
        <div className="flex rounded-xl border border-border bg-card/60 p-1">
          {(['before', 'during', 'after'] as GameDayPhase[]).map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                phase === p
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span><ConceptVisual name={PHASE_META[p].emoji} size="sm" /></span>
              <span>{PHASE_META[p].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div className="max-w-3xl mx-auto px-4 mb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {ALL_CATEGORIES.map((cat) => {
            const active = activeCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCat(cat)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card/60 text-foreground border-border hover:border-primary/40'
                }`}
              >
                <span><ConceptVisual name={CATEGORY_META[cat].emoji} size="sm" /></span>
                <span>{CATEGORY_META[cat].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tag Filters */}
      <div className="max-w-3xl mx-auto px-4 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {POPULAR_TAGS.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all border ${
                  active
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-muted/40 text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                <span><ConceptVisual name={TAG_META[tag].emoji} size="sm" /></span>
                <span>{TAG_META[tag].label}</span>
              </button>
            );
          })}
        </div>

        {/* Active filter summary */}
        {activeFilterCount > 0 && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              <span className="font-bold text-foreground">{sorted.length}</span> of {FOOD_SPOTS.length} spots
            </p>
            <button onClick={clearAll} className="text-[11px] font-semibold text-primary hover:underline">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Bleacher Barometer */}
      <section className="max-w-3xl mx-auto px-4 mb-5">
        <BleacherBarometer />
      </section>

      {/* Results */}
      <section className="max-w-3xl mx-auto px-4 space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <div className="text-3xl mb-2"></div>
            <h3 className="font-bold text-foreground mb-1">No spots match those filters</h3>
            <p className="text-xs text-muted-foreground">Try removing a filter — Wrigleyville has more to offer.</p>
          </div>
        ) : (
          sorted.map((spot, idx) => (
            <FoodSpotCard
              key={spot.id}
              spot={spot}
              index={idx}
              phase={phase}
              isExpanded={expandedId === spot.id}
              onToggle={() => setExpandedId(expandedId === spot.id ? null : spot.id)}
              onViewMap={() => openInMaps(spot)}
            />
          ))
        )}

        {/* Suggest a Spot */}
        <div className="pt-4">
          {!showSuggest ? (
            <button
              onClick={() => setShowSuggest(true)}
              className="w-full rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 text-center transition hover:border-primary/50"
            >
              <MessageSquare className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground mb-1">Know a spot we missed?</p>
              <p className="text-xs text-muted-foreground">Suggest a Wrigleyville favorite and help the community grow the list.</p>
            </button>
          ) : (
            <SuggestSpotForm onClose={() => setShowSuggest(false)} />
          )}
        </div>

        <div className="pt-4 pb-2 text-center text-[10px] text-muted-foreground italic">
          Editorially curated by Wrigleyville Buddies · Spots are not sponsored.
        </div>
      </section>

      {isGuest && <GuestBanner />}
    </div>
  );
}

/* ─── Food Spot Card ─── */

interface CardProps {
  spot: FoodSpot;
  index: number;
  phase: GameDayPhase;
  isExpanded: boolean;
  onToggle: () => void;
  onViewMap: () => void;
}

const VIBE_COLORS: Record<string, string> = {
  Rowdy: 'bg-red-500/10 text-red-700 dark:text-red-400',
  Chill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  Upscale: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  Casual: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  Dive: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  Trendy: 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
  Family: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  Cozy: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
};

function FoodSpotCard({ spot, index, phase, isExpanded, onToggle, onViewMap }: CardProps) {
  const cat = CATEGORY_META[spot.category];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-sm transition-shadow"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-2xl leading-none shrink-0"><ConceptVisual name={spot.emoji} size="sm" /></span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground leading-tight truncate">
                {spot.name}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5"><ConceptVisual name={cat.emoji} size="sm" /> {cat.label}</p>
            </div>
          </div>
          <Badge variant="outline" className={`shrink-0 text-[10px] px-2 py-0 h-5 border-0 ${VIBE_COLORS[spot.vibe] || 'bg-muted text-muted-foreground'}`}>
            {spot.vibe}
          </Badge>
        </div>
      </div>

      {/* Quick info strip */}
      <div className="px-5 pb-3 flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="font-semibold text-foreground">{spot.walkMinutes} min</span> walk
        </span>
        {spot.tvCount && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Tv className="h-3 w-3" />
            <span className="font-semibold text-foreground">{spot.tvCount}</span> TVs
          </span>
        )}
      </div>

      {/* Fan tip */}
      <div className="px-5 pb-3">
        <p className="text-[13px] italic text-muted-foreground leading-snug">
           "{spot.fanTip}"
        </p>
      </div>

      {/* Game Day Status highlight */}
      <div className="px-5 pb-3">
        <div className={`rounded-xl bg-muted/40 border border-border/60 p-3`}>
          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 ${PHASE_META[phase].color}`}>
            <span><ConceptVisual name={PHASE_META[phase].emoji} size="sm" /></span> {PHASE_META[phase].label} pick
          </div>
          <p className="text-xs text-foreground/90 leading-snug">
            {spot.gameDayHighlight[phase]}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {spot.tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-foreground/5 border border-border px-2 py-0.5 text-[10px] font-semibold text-foreground">
            <ConceptVisual name={TAG_META[t].emoji} size="sm" /> {TAG_META[t].label}
          </span>
        ))}
      </div>

      {/* CTAs */}
      <div className="px-5 pb-3">
        <EatsCheckInButton spotName={spot.name} />
      </div>
      <div className="px-5 pb-4 flex gap-2">
        <Button
          size="sm"
          className="flex-1 h-9 rounded-xl gap-1.5 text-xs font-bold"
          onClick={onViewMap}
        >
          <ExternalLink className="h-3.5 w-3.5" /> View on Map
        </Button>
        <Button asChild size="sm" variant="outline" className="h-9 rounded-xl text-xs gap-1">
          <Link to={`/beer-money?bar=${encodeURIComponent(spot.name)}`}>
             Buy a Beer
          </Link>
        </Button>
      </div>

      {/* Expand for all phases */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between border-t border-border/70 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        aria-expanded={isExpanded}
      >
        <span>{isExpanded ? 'Hide details' : 'All game-day tips · address'}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-border/70 bg-background/40"
          >
            <div className="px-5 py-4 space-y-3">
              {/* All phases */}
              {(['before', 'during', 'after'] as GameDayPhase[]).map((p) => (
                <div key={p} className="rounded-lg bg-card border border-border p-3">
                  <div className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${PHASE_META[p].color}`}>
                    <ConceptVisual name={PHASE_META[p].emoji} size="sm" /> {PHASE_META[p].label}
                  </div>
                  <p className="text-xs text-foreground/90">{spot.gameDayHighlight[p]}</p>
                </div>
              ))}

              {/* Address */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-muted-foreground"> {spot.address}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* ─── Suggest a Spot Form ─── */

function SuggestSpotForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
        <p className="text-3xl mb-2"></p>
        <h3 className="font-bold text-foreground mb-1">Thanks for the tip!</h3>
        <p className="text-xs text-muted-foreground mb-3">
          We'll check out <span className="font-semibold">{name}</span> and add it if it's legit.
        </p>
        <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-card p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Suggest a Spot</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div>
        <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Spot name *</label>
        <Input
          placeholder="e.g. Taco Bell Cantina"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl"
        />
      </div>
      <div>
        <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Why should fans go?</label>
        <Input
          placeholder="e.g. Best cheap eats after midnight"
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          className="rounded-xl"
        />
      </div>
      <Button onClick={handleSubmit} disabled={!name.trim()} className="w-full rounded-xl text-sm">
        Submit Suggestion
      </Button>
    </motion.div>
  );
}
