import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { ProfileCard } from '@/components/ProfileCard';
import { IntentChip } from '@/components/IntentChip';
import { MOCK_USERS, IntentType } from '@/types';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Discover() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showFilters, setShowFilters] = useState(false);
  const [filterIntents, setFilterIntents] = useState<IntentType[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const toggleFilterIntent = (i: IntentType) => {
    setFilterIntents((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  };

  const filtered = MOCK_USERS.filter((u) => {
    if (filterIntents.length && !u.intent.some((i) => filterIntents.includes(i))) return false;
    if (filterStatus !== 'all' && u.game_status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      <div className="mx-auto max-w-lg px-4 pt-4">
        {/* Filter toggle */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>Discover</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-4 overflow-hidden rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Filter by intent</span>
              <button onClick={() => setShowFilters(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {(['FriendToWatch', 'ShareABeer', 'PostGameMeetup', 'Dating'] as IntentType[]).map((i) => (
                <IntentChip key={i} intent={i} selected={filterIntents.includes(i)} onClick={() => toggleFilterIntent(i)} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {[{ v: 'all', l: 'All' }, { v: 'AtWrigley', l: '🏟️ At Wrigley' }, { v: 'AtBar', l: '🍻 At a Bar' }, { v: 'WatchingRemote', l: '📺 Remote' }].map((s) => (
                <button
                  key={s.v}
                  onClick={() => setFilterStatus(s.v)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filterStatus === s.v ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40'}`}
                >
                  {s.l}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl">⚾</p>
            <p className="mt-2 font-semibold">No fans found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((user) => (
              <ProfileCard
                key={user.id}
                user={user}
                onHiFive={() => toast({ title: '🖐️ Hi-Five sent!', description: `You hi-fived ${user.display_name}` })}
                onLike={() => toast({ title: '❤️ Liked!', description: `You liked ${user.display_name}` })}
                onSendBeer={() => navigate(`/beer-money?to=${user.id}`)}
                onViewProfile={() => navigate(`/profile/${user.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
