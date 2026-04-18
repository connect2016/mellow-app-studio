import { Lock } from 'lucide-react';

export function PrivateModeBanner() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/40 p-4 text-center">
      <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-left text-xs text-muted-foreground">
        This fan keeps their bars, badges, and meetup history private. Match with them to see more.
      </p>
    </div>
  );
}
