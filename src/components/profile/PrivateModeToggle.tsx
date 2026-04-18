import { Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Props {
  enabled: boolean;
  onChange: (next: boolean) => void;
}

export function PrivateModeToggle({ enabled, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-card/80 p-3">
      <div className="flex items-start gap-2.5">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">Private Mode</p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Hide bars, badges, and history from non-matches
          </p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={onChange} />
    </div>
  );
}
