import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Filter, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useVenueActivity } from '@/hooks/useVenueActivity';
import { VenueCard } from '@/components/VenueCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type SortMode = 'crowd' | 'meetups' | 'vibe';

export default function Venues() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: venues, isLoading } = useVenueActivity();
  const [filter, setFilter] = useState<SortMode>('crowd');
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const filtered = (venues || [])
    .filter((v) => !showOnlyActive || v.totalUsers > 0 || v.meetups.length > 0)
    .sort((a, b) => {
      if (filter === 'meetups') return b.meetups.length - a.meetups.length;
      if (filter === 'vibe') return b.voteCount - a.voteCount;
      return 0; // default sort from hook is crowd
    });

  const totalActive = venues?.reduce((s, v) => s + v.totalUsers, 0) || 0;
  const totalMeetups = venues?.reduce((s, v) => s + v.meetups.length, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
              Wrigleyville Venues
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {totalActive} fans active · {totalMeetups} meetups
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[10px] text-muted-foreground">Live</span>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {([
            { key: 'crowd' as SortMode, icon: Users, label: 'Busiest' },
            { key: 'meetups' as SortMode, icon: Zap, label: 'Meetups' },
            { key: 'vibe' as SortMode, icon: MapPin, label: 'Top Vibes' },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                filter === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
          <button
            onClick={() => setShowOnlyActive((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              showOnlyActive
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Filter className="h-3 w-3" />
            Active only
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">🏙️</span>
            <p className="text-sm text-muted-foreground mt-3">No active venues right now</p>
            <p className="text-xs text-muted-foreground mt-1">Check back closer to game time!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((venue, i) => (
              <VenueCard
                key={venue.name}
                venue={venue}
                index={i}
                onJoinMeetup={(id) => toast.success('Joining meetup! 🎉')}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
