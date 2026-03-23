import { WAIT_LABELS, VIBE_LABELS, type BarVoteSummary } from '@/hooks/useBarVotes';

export function BarVibeBadge({ summary }: { summary: BarVoteSummary }) {
  if (summary.totalVotes === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {summary.topWait && (
        <span className="inline-flex items-center rounded-full bg-secondary/15 border border-secondary/25 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
          ⏱ {WAIT_LABELS[summary.topWait]}
        </span>
      )}
      {summary.topVibe && (
        <span className="inline-flex items-center rounded-full bg-accent/15 border border-accent/25 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
          {VIBE_LABELS[summary.topVibe]}
        </span>
      )}
      <span className="text-[9px] text-muted-foreground">{summary.totalVotes} vote{summary.totalVotes !== 1 ? 's' : ''}</span>
    </div>
  );
}
