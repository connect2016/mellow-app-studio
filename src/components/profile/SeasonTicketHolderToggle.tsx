import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { STHBadge } from './STHBadge';
import { toast } from 'sonner';

const NAVY = 'hsl(var(--brand-navy))';

interface SeasonTicketHolderToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  /** When true, fires the celebratory toast on enable transitions */
  celebrateOnEnable?: boolean;
}

export function SeasonTicketHolderToggle({
  value,
  onChange,
  celebrateOnEnable = true,
}: SeasonTicketHolderToggleProps) {
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    setInternal(value);
  }, [value]);

  const handle = (next: boolean) => {
    setInternal(next);
    onChange(next);
    if (next && celebrateOnEnable && !value) {
      toast.success('Welcome to the STH crew! Your gold badge is now live ⭐');
    }
  };

  return (
    <label
      htmlFor="sth-toggle"
      className="flex items-center justify-between gap-3 rounded-2xl border-2 bg-card p-4 cursor-pointer transition-colors hover:bg-card/90"
      style={{ borderColor: internal ? 'hsl(var(--brand-gold))' : 'hsl(var(--border))' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <STHBadge size="lg" />
        <div className="min-w-0">
          <div className="font-bold text-base leading-tight" style={{ color: NAVY }}>
            I'm a Season Ticket Holder
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Show a gold STH badge on your avatar everywhere.
          </div>
        </div>
      </div>
      <Switch
        id="sth-toggle"
        checked={internal}
        onCheckedChange={handle}
        className="data-[state=checked]:bg-[hsl(var(--brand-gold))]"
      />
    </label>
  );
}
