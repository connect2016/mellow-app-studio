import { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CalendarIcon, Users, Beer, MapPin, Search, Ticket } from 'lucide-react';

const NEARBY_RANGE = 10; // sections within ±10 are "nearby"

const INTENT_OPTIONS = [
  { value: 'beer', label: '🍺 Pre-Game Beer', description: 'Grab a drink before first pitch' },
  { value: 'marquee', label: '📍 Meet at Marquee', description: 'Meet up at the Wrigley marquee' },
  { value: 'both', label: '⚾ Both!', description: 'Down for beer and marquee meetup' },
];

export default function BallparkBuddy() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [date, setDate] = useState<Date | undefined>();
  const [section, setSection] = useState('');
  const [intent, setIntent] = useState('beer');
  const [searchParams, setSearchParams] = useState<{ date: string; section: number } | null>(null);

  // Submit search
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user || !date || !section) throw new Error('Missing fields');
      const gameDate = format(date, 'yyyy-MM-dd');
      const sectionNum = section.trim();

      // Upsert: delete existing for that date, then insert
      await supabase
        .from('ballpark_buddy_searches')
        .delete()
        .eq('user_id', user.id)
        .eq('game_date', gameDate);

      const { error } = await supabase
        .from('ballpark_buddy_searches')
        .insert({
          user_id: user.id,
          game_date: gameDate,
          section: sectionNum,
          intent,
        });
      if (error) throw error;
      return { date: gameDate, section: parseInt(sectionNum, 10) };
    },
    onSuccess: (params) => {
      setSearchParams(params);
      qc.invalidateQueries({ queryKey: ['ballpark-buddy'] });
      toast({ title: '🎟️ You\'re in!', description: 'Looking for nearby buddies...' });
    },
    onError: () => {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    },
  });

  // Fetch matches for the searched date
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['ballpark-buddy', searchParams?.date],
    queryFn: async () => {
      if (!searchParams || !user) return [];
      const { data: searches } = await supabase
        .from('ballpark_buddy_searches')
        .select('*')
        .eq('game_date', searchParams.date)
        .neq('user_id', user.id);

      if (!searches?.length) return [];

      // Get profiles for these users
      const userIds = searches.map((s) => s.user_id);
      const { data: profiles } = await supabase.rpc('get_public_profiles', {
        p_user_ids: userIds,
      });

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return searches
        .map((s) => {
          const profile = profileMap.get(s.user_id);
          if (!profile) return null;
          const sectionNum = parseInt(s.section, 10);
          const distance = Math.abs(sectionNum - searchParams.section);
          return {
            ...s,
            profile,
            sectionNum,
            distance,
            isNearby: distance <= NEARBY_RANGE,
            isExact: distance === 0,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a!.distance - b!.distance) as Array<{
          id: string;
          user_id: string;
          section: string;
          intent: string;
          sectionNum: number;
          distance: number;
          isNearby: boolean;
          isExact: boolean;
          profile: {
            user_id: string;
            display_name: string;
            profile_photo: string | null;
            bio: string | null;
            intent: string[] | null;
            game_status: string | null;
            wrigley_section: string | null;
          };
        }>;
    },
    enabled: !!searchParams && !!user,
  });

  const nearbyMatches = matches.filter((m) => m.isNearby);
  const otherMatches = matches.filter((m) => !m.isNearby);

  const handleSubmit = () => {
    if (!date) {
      toast({ title: 'Pick a game date', variant: 'destructive' });
      return;
    }
    if (!section.trim()) {
      toast({ title: 'Enter your section number', variant: 'destructive' });
      return;
    }
    submitMutation.mutate();
  };

  const intentLabel = (val: string) =>
    val === 'beer' ? '🍺' : val === 'marquee' ? '📍' : '⚾';

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Users className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Ballpark Buddy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find fans near your section for pre-game plans
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          {/* Game Date */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              Game Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start rounded-xl py-6 text-base',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Section */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              Section Number
            </label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. 228"
                className="rounded-xl py-6 pl-10 text-base"
                maxLength={5}
              />
            </div>
          </div>

          {/* Intent */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              What are you looking for?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INTENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIntent(opt.value)}
                  className={cn(
                    'rounded-xl border px-3 py-3 text-center transition-colors',
                    intent === opt.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                  )}
                >
                  <div className="text-lg mb-0.5">{opt.label.split(' ')[0]}</div>
                  <div className="text-[10px] font-medium leading-tight">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full rounded-xl py-6 text-base font-bold"
           
          >
            <Search className="mr-2 h-5 w-5" />
            Scout the Area
          </Button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {searchParams && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <h2 className="text-base font-bold">
                  {matchesLoading ? 'Searching...' : `${matches.length} Buddies Found`}
                </h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  Section {searchParams.section} · {format(new Date(searchParams.date + 'T12:00:00'), 'MMM d')}
                </span>
              </div>

              {matches.length === 0 && !matchesLoading && (
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                   <p className="text-sm font-semibold text-foreground">The bases are empty!</p>
                   <p className="text-xs text-muted-foreground mt-1">
                     Be the first to start a conversation. Rally the troops!
                   </p>
                </div>
              )}

              {/* Nearby section */}
              {nearbyMatches.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    🎯 In Your Area (±{NEARBY_RANGE} sections)
                  </p>
                  <div className="space-y-2">
                    {nearbyMatches.map((m, i) => (
                      <BuddyCard key={m.id} match={m} index={i} intentLabel={intentLabel} />
                    ))}
                  </div>
                </div>
              )}

              {/* Other sections */}
              {otherMatches.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Other Sections
                  </p>
                  <div className="space-y-2">
                    {otherMatches.map((m, i) => (
                      <BuddyCard key={m.id} match={m} index={i} intentLabel={intentLabel} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BuddyCard({
  match,
  index,
  intentLabel,
}: {
  match: {
    id: string;
    section: string;
    intent: string;
    isExact: boolean;
    isNearby: boolean;
    distance: number;
    profile: {
      display_name: string;
      profile_photo: string | null;
      bio: string | null;
    };
  };
  index: number;
  intentLabel: (v: string) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-3',
        match.isExact
          ? 'border-primary/30 bg-primary/[0.04]'
          : 'border-border bg-card'
      )}
    >
      {/* Avatar */}
      <div className="h-11 w-11 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
        {match.profile.profile_photo ? (
          <img src={match.profile.profile_photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm font-bold text-muted-foreground">
            {match.profile.display_name?.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground truncate">
            {match.profile.display_name}
          </p>
          {match.isExact && (
            <span className="text-[9px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
              SAME SECTION
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Sec {match.section}
          </span>
          <span className="text-xs text-muted-foreground">
            {intentLabel(match.intent)} {match.intent === 'beer' ? 'Pre-game beer' : match.intent === 'marquee' ? 'Marquee meetup' : 'Beer & Marquee'}
          </span>
        </div>
        {match.profile.bio && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{match.profile.bio}</p>
        )}
      </div>

      {/* Distance badge */}
      <div className="text-center shrink-0">
        <div className={cn(
          'text-xs font-bold',
          match.isNearby ? 'text-primary' : 'text-muted-foreground'
        )}>
          {match.distance === 0 ? '✓' : `${match.distance}`}
        </div>
        <div className="text-[9px] text-muted-foreground">
          {match.distance === 0 ? 'exact' : 'sec away'}
        </div>
      </div>
    </motion.div>
  );
}
