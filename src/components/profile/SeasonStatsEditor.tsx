import { useState } from 'react';
import { UtensilsCrossed, Pizza, Plus, Minus, Check } from 'lucide-react';
import { HotDogIcon } from '@/components/icons/CustomIcons';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FOOD_SPOTS } from '@/lib/wrigleyville-eats';
import { CURATED_BARS } from '@/lib/wrigleyville-bar-guide';
import { cn } from '@/lib/utils';

export interface SeasonStatsValues {
  shots_taken_season: number;
  appetizers_had_season: number;
  favorite_food_spot: string | null;
}

interface SeasonStatsEditorProps {
  values: SeasonStatsValues;
  onUpdate: (patch: Partial<SeasonStatsValues>) => void;
}

// Combined, deduped, sorted list of Wrigleyville restaurants + bars.
const FOOD_SPOT_OPTIONS: string[] = Array.from(
  new Set([
    ...FOOD_SPOTS.map((s) => s.name),
    ...CURATED_BARS.map((b) => b.name),
  ])
).sort((a, b) => a.localeCompare(b));

export function SeasonStatsEditor({ values, onUpdate }: SeasonStatsEditorProps) {
  const { toast } = useToast();
  const [savingSpot, setSavingSpot] = useState(false);

  const adjust = (key: 'shots_taken_season' | 'appetizers_had_season', delta: number) => {
    const next = Math.max(0, (values[key] ?? 0) + delta);
    onUpdate({ [key]: next } as Partial<SeasonStatsValues>);
  };

  const handleSpotChange = (next: string) => {
    setSavingSpot(true);
    onUpdate({ favorite_food_spot: next });
    toast({ title: 'Favorite food spot updated', description: next });
    setTimeout(() => setSavingSpot(false), 600);
  };

  const counters: Array<{
    key: 'shots_taken_season' | 'appetizers_had_season';
    label: string;
    Icon: typeof Wine;
    quickAdd: number[];
  }> = [
    { key: 'shots_taken_season', label: 'Shots Taken (Season)', Icon: Wine, quickAdd: [1, 3, 5] },
    { key: 'appetizers_had_season', label: 'Appetizers Had (Season)', Icon: UtensilsCrossed, quickAdd: [1, 2, 4] },
  ];

  return (
    <section
      className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-4 space-y-4 shadow-sm"
      aria-label="Season fan stats editor"
    >
      <div>
        <h3
          className="text-[13px] font-extrabold uppercase tracking-wide text-foreground"
          style={{ fontFamily: 'Norwester, sans-serif' }}
        >
          Season Fan Stats
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Track your season totals and pick your favorite Wrigleyville food spot.
        </p>
      </div>

      {counters.map(({ key, label, Icon, quickAdd }) => (
        <div
          key={key}
          className="rounded-2xl bg-muted/40 border border-border/30 p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground leading-tight truncate">{label}</p>
                <p className="text-[11px] text-muted-foreground">Tap +/− or quick-add</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-full active:scale-[0.95] transition-transform"
                onClick={() => adjust(key, -1)}
                aria-label={`Decrease ${label}`}
                disabled={(values[key] ?? 0) <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span
                className="text-2xl font-extrabold text-foreground min-w-[2.25rem] text-center tabular-nums"
                aria-live="polite"
                aria-label={`${label}: ${values[key] ?? 0}`}
              >
                {values[key] ?? 0}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-full active:scale-[0.95] transition-transform"
                onClick={() => adjust(key, 1)}
                aria-label={`Increase ${label}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {quickAdd.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => adjust(key, n)}
                className={cn(
                  'rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary',
                  'min-h-[36px] active:scale-[0.96] transition-all hover:bg-primary/15'
                )}
                aria-label={`Add ${n} to ${label}`}
              >
                +{n}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-2xl bg-muted/40 border border-border/30 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Pizza className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight">Favorite Food Spot</p>
            <p className="text-[11px] text-muted-foreground">
              Shown publicly on your card
            </p>
          </div>
          {savingSpot && <Check className="h-4 w-4 text-primary ml-auto" aria-hidden />}
        </div>
        <Select
          value={values.favorite_food_spot ?? undefined}
          onValueChange={handleSpotChange}
        >
          <SelectTrigger
            className="w-full min-h-[48px] rounded-xl bg-background"
            aria-label="Choose your favorite Wrigleyville food spot"
          >
            <SelectValue placeholder="Pick a Wrigleyville spot…" />
          </SelectTrigger>
          <SelectContent className="max-h-[320px]">
            {FOOD_SPOT_OPTIONS.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
