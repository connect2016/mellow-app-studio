import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, Users } from 'lucide-react';
import { CardHeading, Caption } from '@/components/ui/Typography';
import {
  usePersonalCrew,
  useAddToPersonalCrew,
  useRemoveFromPersonalCrew,
  PERSONAL_CREW_MAX,
} from '@/hooks/usePersonalCrew';
import { useTeammates } from '@/hooks/useTeammates';
import { cn } from '@/lib/utils';

export function MyCrewSection() {
  const { data: crew = [], isLoading } = usePersonalCrew();
  const { data: teammates = [] } = useTeammates();
  const add = useAddToPersonalCrew();
  const remove = useRemoveFromPersonalCrew();
  const [picking, setPicking] = useState(false);

  const crewIds = useMemo(() => new Set(crew.map(c => c.crew_member_user_id)), [crew]);
  const addable = useMemo(
    () => teammates.filter(t => !crewIds.has(t.user_id)),
    [teammates, crewIds]
  );

  const full = crew.length >= PERSONAL_CREW_MAX;

  return (
    <section className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm shadow-sm p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <CardHeading
            as="h3"
            className="text-[13px] font-extrabold uppercase tracking-wide text-foreground"
            style={{ fontFamily: 'Norwester, sans-serif' }}
          >
            My Crew
          </CardHeading>
          <Caption as="p" className="text-[11px] text-muted-foreground mt-0.5">
            Up to {PERSONAL_CREW_MAX} fans you ride with. Crew members get first dibs on your meetups.
          </Caption>
        </div>
        <span className="text-[11px] font-bold text-muted-foreground">
          {crew.length}/{PERSONAL_CREW_MAX}
        </span>
      </div>

      {isLoading ? (
        <div className="flex gap-2 mt-3" aria-label="Loading crew">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 w-14 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      ) : crew.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
          <Users className="h-7 w-7 mx-auto text-muted-foreground/70" />
          <p className="text-[12px] mt-2 text-muted-foreground">
            No crew yet. Add up to {PERSONAL_CREW_MAX} of your teammates to fast-track plans.
          </p>
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-4 gap-3">
          {crew.map(m => (
            <li key={m.id} className="flex flex-col items-center gap-1.5 relative">
              <Link
                to={`/profile/${m.crew_member_user_id}`}
                className="block"
                aria-label={`View ${m.display_name}`}
              >
                {m.profile_photo ? (
                  <img
                    src={m.profile_photo}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/40"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </Link>
              <span className="text-[11px] font-semibold text-foreground truncate max-w-[64px]">
                {m.display_name}
              </span>
              <button
                type="button"
                onClick={() => remove.mutate(m.crew_member_user_id)}
                disabled={remove.isPending}
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-background border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                aria-label={`Remove ${m.display_name} from crew`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setPicking(v => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-2 min-h-[44px]',
              'bg-primary text-primary-foreground font-bold text-[13px]',
              'hover:bg-primary/90 transition-colors'
            )}
          >
            <Plus className="h-4 w-4" />
            {picking ? 'Close' : 'Add from teammates'}
          </button>

          {picking && (
            <div className="mt-3 rounded-xl border border-border bg-background/60 p-2 max-h-64 overflow-y-auto">
              {addable.length === 0 ? (
                <p className="text-[12px] text-muted-foreground text-center py-4">
                  No teammates left to add. Recruit more from the Dugout.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {addable.map(t => (
                    <li key={t.user_id} className="flex items-center gap-3 py-2">
                      {t.profile_photo ? (
                        <img src={t.profile_photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="flex-1 text-[13px] font-semibold text-foreground truncate">
                        {t.display_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => add.mutate(t.user_id)}
                        disabled={add.isPending}
                        className="rounded-full bg-secondary/15 text-secondary px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wide min-h-[36px] hover:bg-secondary/25"
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
