import { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Users, Clock, Play, ChevronRight, Map } from 'lucide-react';
import { usePubCrawls } from '@/hooks/usePubCrawls';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { WRIGLEYVILLE_BARS } from '@/types';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { LiveCrawlMap } from '@/components/map/LiveCrawlMap';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

function CreateCrawlForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [startBar, setStartBar] = useState('');
  const [startTime, setStartTime] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [addingStop, setAddingStop] = useState('');
  const { createCrawl } = usePubCrawls();

  const handleAddStop = () => {
    if (addingStop && !stops.includes(addingStop)) {
      setStops([...stops, addingStop]);
      setAddingStop('');
    }
  };

  const handleCreate = () => {
    if (!title || !startBar || !startTime) return;
    const allStops = [startBar, ...stops];
    createCrawl.mutate(
      { title, start_bar: startBar, start_time: new Date(startTime).toISOString(), stops: allStops },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-lg font-bold text-foreground">Create a Pub Crawl</h3>
      <Input placeholder="Crawl name (e.g. 'Friday Night Crawl')" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Start Time</label>
        <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="rounded-xl" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Starting Bar</label>
        <Select value={startBar} onValueChange={setStartBar}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick the first bar" /></SelectTrigger>
          <SelectContent className="max-h-60">
            {WRIGLEYVILLE_BARS.map((bar) => (<SelectItem key={bar.id} value={bar.name}>{bar.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Additional Stops ({stops.length})</label>
        {stops.map((s, i) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-primary w-5">{i + 2}.</span>
            <span className="text-sm text-foreground">{s}</span>
            <button className="text-xs text-destructive ml-auto" onClick={() => setStops(stops.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <Select value={addingStop} onValueChange={setAddingStop}>
            <SelectTrigger className="rounded-xl flex-1"><SelectValue placeholder="Add another bar" /></SelectTrigger>
            <SelectContent className="max-h-60">
              {WRIGLEYVILLE_BARS.filter(b => b.name !== startBar && !stops.includes(b.name)).map((bar) => (<SelectItem key={bar.id} value={bar.name}>{bar.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="secondary" onClick={handleAddStop} className="rounded-xl"><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
        <Button className="flex-1 rounded-xl" onClick={handleCreate} disabled={!title || !startBar || !startTime || createCrawl.isPending}>
          {createCrawl.isPending ? 'Creating...' : 'Start Crawl <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />'}
        </Button>
      </div>
    </div>
  );
}

export default function PubCrawl() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [viewingCrawlId, setViewingCrawlId] = useState<string | null>(null);
  const { crawls, isLoading, getStopsForCrawl, getMembersForCrawl, isUserInCrawl, joinCrawl, leaveCrawl, updateStatus, markArrived } = usePubCrawls();

  const viewingCrawl = crawls.find(c => c.id === viewingCrawlId);

  // If viewing a live crawl map
  if (viewingCrawl) {
    const stops = getStopsForCrawl(viewingCrawl.id);
    const members = getMembersForCrawl(viewingCrawl.id);
    const isCreator = viewingCrawl.creator_id === user?.id;
    const inCrawl = isUserInCrawl(viewingCrawl.id);

    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="mx-auto max-w-lg px-4 pt-4">
          <LiveCrawlMap
            stops={stops}
            crawlTitle={viewingCrawl.title}
            memberCount={members.length}
            isCreator={isCreator}
            isInCrawl={inCrawl}
            profilePhoto={profile?.profile_photo || undefined}
            onMarkArrived={(stopId) => markArrived.mutate({ stopId })}
            onJoin={() => joinCrawl.mutate(viewingCrawl.id)}
            onLeave={() => { leaveCrawl.mutate(viewingCrawl.id); setViewingCrawlId(null); }}
            onBack={() => setViewingCrawlId(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pub Crawls</h1>
            <p className="text-sm text-muted-foreground">Join a crew or start your own bar-hopping adventure</p>
          </div>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>

        {showCreate && <CreateCrawlForm onClose={() => setShowCreate(false)} />}

        {isLoading && <div className="text-center py-12 text-muted-foreground">Loading crawls...</div>}

        <div className="space-y-4 mt-4">
          {crawls.map((crawl) => {
            const stops = getStopsForCrawl(crawl.id);
            const members = getMembersForCrawl(crawl.id);
            const inCrawl = isUserInCrawl(crawl.id);
            const isCreator = crawl.creator_id === user?.id;
            const isLive = crawl.status === 'live';

            // Find current bar for "Join the Pack" CTA
            const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order);
            const lastArrived = sortedStops.reduce((acc, s, i) => (s.arrived_at ? i : acc), -1);
            const currentBar = sortedStops[lastArrived >= 0 ? lastArrived : 0]?.bar_name;

            return (
              <div
                key={crawl.id}
                className={`rounded-2xl border p-4 space-y-3 transition-all ${
                  isLive ? 'border-primary/50 bg-primary/5 shadow-md' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground truncate">{crawl.title}</h3>
                      {isLive && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground animate-pulse">LIVE</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(crawl.start_time), 'MMM d · h:mm a')}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{members.length} joined</span>
                    </div>
                  </div>
                </div>

                {/* Route */}
                {stops.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {sortedStops.map((stop, i) => (
                      <div key={stop.id} className="flex items-center shrink-0">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${
                          stop.arrived_at ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          <MapPin className="h-3 w-3" />
                          {stop.bar_name.length > 18 ? stop.bar_name.slice(0, 18) + '…' : stop.bar_name}
                        </div>
                        {i < stops.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 mx-0.5 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}

                {/* Live: Join the Pack CTA */}
                {isLive && !inCrawl && currentBar && (
                  <Button
                    className="w-full rounded-xl font-bold gap-2 bg-primary min-h-[44px]"
                    onClick={() => { joinCrawl.mutate(crawl.id); setViewingCrawlId(crawl.id); }}
                  >
                    <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> The Pack is at {currentBar.length > 18 ? currentBar.slice(0, 18) + '…' : currentBar} — Join Them!
                  </Button>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {isCreator && crawl.status === 'planning' && (
                    <Button size="sm" className="flex-1 rounded-xl gap-1.5 min-h-[44px] text-xs font-bold"
                      onClick={() => updateStatus.mutate({ crawlId: crawl.id, status: 'live' })}>
                      <Play className="h-3.5 w-3.5" /> Go Live
                    </Button>
                  )}
                  {!inCrawl ? (
                    <Button size="sm" className="flex-1 rounded-xl min-h-[44px] text-xs font-bold"
                      onClick={() => joinCrawl.mutate(crawl.id)} disabled={joinCrawl.isPending}>
                      Join Crawl <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl min-h-[44px] text-xs font-bold"
                      onClick={() => leaveCrawl.mutate(crawl.id)} disabled={leaveCrawl.isPending}>
                      Leave
                    </Button>
                  )}
                  {isLive && (
                    <Button size="sm" variant="secondary" className="rounded-xl min-h-[44px] text-xs font-bold gap-1"
                      onClick={() => setViewingCrawlId(crawl.id)}>
                      <Map className="h-3.5 w-3.5" /> Live Map
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" className="rounded-xl min-h-[44px] text-xs font-bold"
                    onClick={() => navigate('/bar-map')}>
                    Map
                  </Button>
                </div>

                {crawl.invite_code && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    Invite: <span className="font-mono font-bold text-foreground">{crawl.invite_code}</span>
                  </p>
                )}
              </div>
            );
          })}

          {!isLoading && crawls.length === 0 && !showCreate && (
            <div className="text-center py-16 space-y-3">
              <span className="text-4xl"><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
              <p className="text-base font-bold text-foreground">No active pub crawls</p>
              <p className="text-sm text-muted-foreground">Be the first to start one tonight!</p>
              <Button onClick={() => setShowCreate(true)} className="rounded-xl"><Plus className="h-4 w-4 mr-1" /> Create a Crawl</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
