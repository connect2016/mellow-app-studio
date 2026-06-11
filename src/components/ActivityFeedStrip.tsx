import { Link } from 'react-router-dom';
import { useActivityFeed, useReactWFlag, type ActivityFeedItem } from '@/hooks/useActivityFeed';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { cn } from '@/lib/utils';

function describe(item: ActivityFeedItem): string {
  const where = item.location_zone ? ` at ${item.location_zone}` : '';
  switch (item.activity_type) {
    case 'meetup_hosted':
      return `is hosting a meetup${where}`;
    case 'meetup_joined':
      return `joined a meetup${where}`;
    case 'bar_checkin':
      return `checked in${where}`;
    default:
      return item.context_text ?? 'is on the move';
  }
}

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function ActivityFeedStrip() {
  const { data: items = [], isLoading } = useActivityFeed(15);
  const react = useReactWFlag();

  if (isLoading || items.length === 0) return null;

  return (
    <section className="mb-4" aria-label="Live activity from the bleachers">
      <div className="flex items-baseline justify-between px-1 mb-2">
        <h2
          className="text-[13px] font-extrabold uppercase tracking-wider text-white drop-shadow"
          style={{ fontFamily: 'Norwester, sans-serif' }}
        >
          From the Bleachers
        </h2>
        <span className="text-[11px] font-semibold text-white/75">{items.length} live</span>
      </div>
      <div className="-mx-1 overflow-x-auto scrollbar-none">
        <div className="flex gap-2.5 px-1 pb-1.5">
          {items.map(item => (
            <article
              key={item.id}
              className="shrink-0 w-[230px] rounded-2xl border border-white/15 bg-card/95 backdrop-blur-sm shadow-sm p-3 flex flex-col gap-2"
            >
              <Link
                to={`/profile/${item.user_id}`}
                className="flex items-center gap-2 min-w-0"
              >
                {item.profile_photo ? (
                  <img
                    src={item.profile_photo}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/30" loading="lazy" decoding="async" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                    <ConceptIcon name="user" className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[13px] font-bold text-foreground truncate">
                    <span className="truncate">{item.display_name}</span>
                    {item.fan_tier_emoji && (
                      <span className="text-xs">{item.fan_tier_emoji}</span>
                    )}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    {timeAgo(item.created_at)}
                  </div>
                </div>
              </Link>
              <p className="text-[12px] leading-snug text-foreground/85 line-clamp-2">
                {describe(item)}
              </p>
              <button
                type="button"
                onClick={() => react.mutate(item.id)}
                disabled={react.isPending}
                className={cn(
                  'self-start inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider min-h-[28px]',
                  'bg-secondary/15 text-secondary hover:bg-secondary/25 transition-colors'
                )}
                aria-label="Send a W flag"
              >
                🚩 W · {item.w_flag_count ?? 0}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
