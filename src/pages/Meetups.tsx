import { SEOMeta } from '@/components/SEOMeta';
import { useMemo, useState } from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useLineupMeetups } from '@/hooks/useLineup';
import { CreateMeetupModal } from '@/components/lineup/CreateMeetupModal';
import { MeetupCard } from '@/components/meetups/MeetupCard';
import { MeetupFilters, type WhenFilter, type WhereFilter } from '@/components/meetups/MeetupFilters';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { GuestBanner } from '@/components/GuestBanner';
import { usePersonalCrewIds } from '@/hooks/usePersonalCrew';
import { DynamicBackground } from '@/components/DynamicBackground';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { DesktopPanel } from '@/components/DesktopPanel';

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export default function Meetups() {
  const { isGuest } = useGuestMode();
  const { data: meetups = [], isLoading } = useLineupMeetups();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [when, setWhen] = useState<WhenFilter>('all');
  const [where, setWhere] = useState<WhereFilter>('all');
  const crewIds = usePersonalCrewIds();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return meetups.filter(m => {
      // Search
      if (q) {
        const hay = `${m.location_name} ${m.creator_name} ${m.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // When
      const minsUntil = (new Date(m.meeting_time).getTime() - Date.now()) / 60000;
      if (when === 'soon' && (minsUntil < 0 || minsUntil > 60)) return false;
      if (when === 'today' && !isToday(m.meeting_time)) return false;
      if (when === 'later' && minsUntil <= 60) return false;
      // Where
      const loc = m.location_name.toLowerCase();
      if (where === 'wrigley' && !loc.includes('wrigley') && !loc.includes('bleacher') && !loc.includes('rooftop')) {
        return false;
      }
      if (where === 'bars' && (loc.includes('wrigley') || loc.includes('bleacher') || loc.includes('rooftop'))) {
        return false;
      }
      if (where === 'crew' && !crewIds.has(m.creator_id)) {
        return false;
      }
      return true;
    });
  }, [meetups, search, when, where, crewIds]);

  const happeningSoon = filtered.filter(m => {
    const mins = (new Date(m.meeting_time).getTime() - Date.now()) / 60000;
    return mins >= 0 && mins <= 60;
  });
  const laterToday = filtered.filter(m => {
    const mins = (new Date(m.meeting_time).getTime() - Date.now()) / 60000;
    return mins > 60;
  });

  return (
    <DynamicBackground>
    <div className={`min-h-screen relative overflow-x-hidden ${isGuest ? 'pb-20' : 'pb-24'}`}>
      <SEOMeta
        title="Meetups — Cubs Fan Game-Day Plans"
        description="Browse and join Cubs fan meetups around Wrigleyville. Find your group for tonight's game, pre-game beers, or the after-party."
        url="/meetups"
      />
      <div className="relative z-10 swipe-drag" data-route-parallax="fg">
      <AppHeader />

      <main className="mx-auto max-w-2xl px-4 pt-4">
        {/* Hero header */}
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">Meetups</h1>
          <p className="text-sm text-white/85 mt-0.5 drop-shadow">
            {meetups.length === 0 ? 'Find your crew' : 'Find your crew · Tap any card to RSVP'}
          </p>

        </div>

        {/* Filters */}
        <div className="mb-5">
          <MeetupFilters
            search={search}
            onSearch={setSearch}
            when={when}
            onWhen={setWhen}
            where={where}
            onWhere={setWhere}
          />
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3" aria-label="Loading meetups">
            {Array(6).fill(null).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-6 min-h-[40vh]">
            <ConceptIcon name="baseball" className="h-16 w-16" style={{ color: 'hsl(var(--brand-navy))' }} />
            <h3
              className="mt-4 text-center"
              style={{
                color: '#FFFFFF',
                fontSize: '20px',
                fontWeight: 700,
                textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)',
              }}
            >
              No meetups yet — be the first!
            </h3>
            <p
              className="mt-1.5 max-w-[300px] text-center"
              style={{
                color: 'rgba(255,255,255,0.92)',
                fontSize: '14px',
                fontWeight: 400,
                textShadow: '0 1px 6px rgba(0,0,0,0.85)',
              }}
            >
              Create a meetup and your crew will find you.
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              className="mt-5 rounded-full gap-1.5 h-10 px-5 font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              <Plus className="h-4 w-4" /> Create a Meetup
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {happeningSoon.length > 0 && (
              <Section title="Happening soon" count={happeningSoon.length}>
                <div className="space-y-3">
                  {happeningSoon.map(m => <MeetupCard key={m.id} meetup={m} />)}
                </div>
              </Section>
            )}
            {laterToday.length > 0 && (
              <Section title="Later" count={laterToday.length}>
                <div className="space-y-3">
                  {laterToday.map(m => <MeetupCard key={m.id} meetup={m} />)}
                </div>
              </Section>
            )}
          </div>
        )}
      </main>

      <CreateMeetupModal open={showCreate} onClose={() => setShowCreate(false)} />
      {isGuest && <GuestBanner />}
      </div>
    </div>
    </DynamicBackground>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2 px-1">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-white drop-shadow">{title}</h2>
        <span className="text-[11px] font-semibold text-white/75">{count}</span>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ onCreate, hasFilters }: { onCreate: () => void; hasFilters: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center">
      <CalendarDays className="h-10 w-10 mx-auto text-primary/60" />
      <h3 className="mt-3 text-base font-bold text-destructive-foreground">
        {hasFilters ? 'No meetups match your filters' : 'No meetups on deck'}
      </h3>
      <p className="text-xs mt-1 max-w-xs mx-auto text-destructive-foreground">
        {hasFilters
          ? 'Try clearing filters or searching for a different bar.'
          : 'Your crew is out there — probably eating nachos. Be the first to post one.'}
      </p>
      <Button onClick={onCreate} className="mt-4 rounded-full gap-1.5 h-10 px-5 font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90">
        <Plus className="h-4 w-4" /> Post a Meetup
      </Button>
    </div>
  );
}
