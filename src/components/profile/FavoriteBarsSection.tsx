import { useState } from 'react';
import { Beer, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CURATED_BARS } from '@/lib/wrigleyville-bar-guide';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface Props {
  bars: string[];
  isOwner: boolean;
  onChange?: (next: string[]) => void;
}

const MAX_BARS = 5;

export function FavoriteBarsSection({ bars, isOwner, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const toggle = (name: string) => {
    if (!onChange) return;
    if (bars.includes(name)) {
      onChange(bars.filter((b) => b !== name));
    } else if (bars.length < MAX_BARS) {
      onChange([...bars, name]);
    }
  };

  if (!isOwner && bars.length === 0) {
    return (
      <div className="rounded-xl border bg-card/60 p-4 text-center text-sm text-muted-foreground">
        No favorite bars yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Beer className="h-4 w-4 text-primary" /> Favorite Bars
          <span className="text-xs font-normal text-muted-foreground">
            {bars.length}/{MAX_BARS}
          </span>
        </div>
        {isOwner && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 rounded-lg text-xs">
                <Plus className="h-3.5 w-3.5" /> Edit
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <div className="border-b p-3 text-xs font-semibold text-muted-foreground">
                Pick up to {MAX_BARS} go-to spots
              </div>
              <div className="max-h-72 overflow-y-auto p-1">
                {CURATED_BARS.map((bar) => {
                  const selected = bars.includes(bar.name);
                  const disabled = !selected && bars.length >= MAX_BARS;
                  return (
                    <button
                      key={bar.id}
                      onClick={() => toggle(bar.name)}
                      disabled={disabled}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted disabled:opacity-40"
                    >
                      <span className="text-base">{bar.emoji}</span>
                      <span className="flex-1 truncate">{bar.name}</span>
                      {selected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {bars.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/40 p-4 text-center text-xs text-muted-foreground">
          Tap <span className="font-semibold">Edit</span> to add your top spots
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {bars.map((name) => {
            const bar = CURATED_BARS.find((b) => b.name === name);
            return (
              <Badge
                key={name}
                variant="secondary"
                className="gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
              >
                <span>{bar?.emoji ?? ''}</span>
                {name}
                {isOwner && (
                  <button
                    onClick={() => toggle(name)}
                    className="ml-0.5 -mr-1 rounded-full p-0.5 hover:bg-foreground/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
