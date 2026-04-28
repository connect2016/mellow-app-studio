import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Check, X, Utensils } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export interface FoodPromptValues {
  pregame_meal?: string | null;
  postgame_food?: string | null;
  carb_up_strategy?: string | null;
  favorite_bar_food?: string | null;
  post_win_meal?: string | null;
}

export type FoodPromptKey = keyof FoodPromptValues;

interface PromptDef {
  key: FoodPromptKey;
  label: string;
  placeholder: string;
  emoji: string;
  gradient: string;
}

export const FOOD_PROMPTS: PromptDef[] = [
  {
    key: 'pregame_meal',
    label: 'My go-to pregame meal is…',
    placeholder: 'Italian beef from Portillo\'s, no question.',
    emoji: '🥪',
    gradient: 'from-amber-500/15 to-orange-500/5',
  },
  {
    key: 'postgame_food',
    label: 'Best postgame food in Wrigleyville…',
    placeholder: 'Late-night slice at Dimo\'s hits different.',
    emoji: '🍕',
    gradient: 'from-red-500/15 to-orange-500/5',
  },
  {
    key: 'carb_up_strategy',
    label: 'Carb-up strategy:',
    placeholder: 'Two slices, one pretzel, zero regrets.',
    emoji: '🍞',
    gradient: 'from-yellow-500/15 to-amber-500/5',
  },
  {
    key: 'favorite_bar_food',
    label: 'Favorite Wrigleyville bar food…',
    placeholder: 'Nachos at Murphy\'s — fight me.',
    emoji: '🍟',
    gradient: 'from-emerald-500/15 to-lime-500/5',
  },
  {
    key: 'post_win_meal',
    label: 'What I\'m eating after a Cubs win…',
    placeholder: 'Tacos at Big Star. Always.',
    emoji: '🌮',
    gradient: 'from-rose-500/15 to-red-500/5',
  },
];

interface Props {
  values: FoodPromptValues;
  isOwner: boolean;
  onChange?: (key: FoodPromptKey, value: string) => void;
}

export function FoodPromptsSection({ values, isOwner, onChange }: Props) {
  const filled = useMemo(
    () => FOOD_PROMPTS.filter((p) => (values[p.key] ?? '').trim().length > 0),
    [values],
  );
  const empty = useMemo(
    () => FOOD_PROMPTS.filter((p) => !(values[p.key] ?? '').trim().length),
    [values],
  );

  // For viewers (not owner): only show filled prompts. If none, hide section.
  if (!isOwner && filled.length === 0) return null;

  return (
    <section>
      <header className="mb-3 flex items-center gap-2">
        <Utensils className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
          Add more about yourself
        </h2>
      </header>

      <div className="space-y-3">
        {filled.map((p) => (
          <PromptCard
            key={p.key}
            def={p}
            value={values[p.key] ?? ''}
            isOwner={isOwner}
            onSave={isOwner && onChange ? (v) => onChange(p.key, v) : undefined}
          />
        ))}
        {isOwner &&
          empty.map((p) => (
            <PromptCard
              key={p.key}
              def={p}
              value=""
              isOwner
              onSave={onChange ? (v) => onChange(p.key, v) : undefined}
            />
          ))}
      </div>
    </section>
  );
}

function PromptCard({
  def,
  value,
  isOwner,
  onSave,
}: {
  def: PromptDef;
  value: string;
  isOwner: boolean;
  onSave?: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const hasValue = value.trim().length > 0;

  if (!isOwner) {
    return (
      <article
        className={`rounded-2xl border border-border bg-gradient-to-br ${def.gradient} p-4`}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-base">{def.emoji}</span>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {def.label}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{value}</p>
      </article>
    );
  }

  if (editing) {
    return (
      <article className="rounded-2xl border border-primary/40 bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-base">{def.emoji}</span>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground">
            {def.label}
          </p>
        </div>
        <Textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={def.placeholder}
          maxLength={140}
          className="min-h-[72px] rounded-xl text-sm"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">{draft.length}/140</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 min-h-[44px] gap-1 rounded-lg px-3 text-xs"
              onClick={() => {
                setDraft(value);
                setEditing(false);
              }}
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
            <Button
              size="sm"
              className="h-9 min-h-[44px] gap-1 rounded-lg px-3 text-xs font-bold"
              onClick={() => {
                onSave?.(draft.trim());
                setEditing(false);
              }}
            >
              <Check className="h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </div>
      </article>
    );
  }

  // Owner, not editing
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`w-full text-left rounded-2xl border p-4 transition-all min-h-[72px] active:scale-[0.99] ${
        hasValue
          ? `border-border bg-gradient-to-br ${def.gradient} hover:border-primary/40`
          : 'border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/40'
      }`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-base">{def.emoji}</span>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground flex-1">
          {def.label}
        </p>
        {hasValue ? (
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      {hasValue ? (
        <p className="text-sm leading-relaxed text-foreground">{value}</p>
      ) : (
        <p className="text-xs italic text-muted-foreground">Tap to add</p>
      )}
    </button>
  );
}
