import { SEOMeta } from '@/components/SEOMeta';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useCrews, useCreateCrew, useJoinCrew, type Crew } from '@/hooks/useCrews';
import { Users, Plus, Search, Lock, Globe, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { PageTitle, SectionHeading, BodyText, CardHeading } from '@/components/ui/Typography';

const BADGE_EMOJIS = ['', '', '', '', '', '', '', '', '', '', '', ''];

export default function Crews() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: crews = [], isLoading } = useCrews();
  const createCrew = useCreateCrew();
  const joinCrew = useJoinCrew();

  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEmoji, setNewEmoji] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const myCrews = crews.filter(c => c.is_member);
  const discoverCrews = crews.filter(c => !c.is_member && c.is_public);
  const filtered = search
    ? discoverCrews.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : discoverCrews;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const crew = await createCrew.mutateAsync({ name: newName.trim(), description: newDesc.trim(), badge_emoji: newEmoji });
      toast.success(`${newEmoji} "${newName}" created!`);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      navigate(`/crews/${crew.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create crew');
    }
  };

  const handleJoin = async (crew: Crew) => {
    if ((crew.member_count ?? 0) >= crew.max_members) {
      toast.error('This crew is full');
      return;
    }
    try {
      await joinCrew.mutateAsync(crew.id);
      toast.success(`Joined ${crew.badge_emoji} ${crew.name}!`);
      navigate(`/crews/${crew.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to join');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEOMeta
        title="Crews — Find Your Cubs Squad"
        description="Join or create a Cubs fan crew. Plan game-day meetups, share inside jokes, and build your baseball squad on Cubbies Buddies."
      />
      <AppHeader />

      <div className="mx-auto max-w-lg px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <PageTitle className="text-xl font-bold">Crews</PageTitle>
            <BodyText className="text-sm text-muted-foreground">Your game-day squads</BodyText>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm" className="rounded-full gap-1.5">
            <Plus className="h-4 w-4" />
            New Crew
          </Button>
        </div>

        {/* Create modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="rounded-2xl border border-primary/20 bg-card p-5 space-y-4 shadow-sm">
                <CardHeading className="font-bold text-foreground">Create a Crew</CardHeading>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Crew Badge</Label>
                  <div className="flex flex-wrap gap-2">
                    {BADGE_EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => setNewEmoji(e)}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                          newEmoji === e
                            ? 'bg-primary/10 border-2 border-primary shadow-sm'
                            : 'bg-muted border border-border hover:border-primary/30'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Crew Name</Label>
                  <Input
                    placeholder="e.g. Bleacher Boys"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    maxLength={40}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
                  <Input
                    placeholder="What's your crew about?"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    maxLength={120}
                    className="rounded-xl"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={!newName.trim() || createCrew.isPending} className="flex-1 rounded-xl">
                    {createCrew.isPending ? 'Creating...' : `${newEmoji} Create Crew`}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My Crews */}
        {myCrews.length > 0 && (
          <div className="mb-6">
            <SectionHeading className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Crews</SectionHeading>
            <div className="space-y-2">
              {myCrews.map((crew, i) => (
                <motion.button
                  key={crew.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/crews/${crew.id}`)}
                  className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    {crew.badge_emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardHeading as="p" className="font-semibold text-foreground truncate">{crew.name}</CardHeading>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {crew.member_count}/{crew.max_members} members
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Discover Crews */}
        <div>
          <SectionHeading className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Discover Crews</SectionHeading>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search crews..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <BuddyListItemSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-3xl"></p>
              <p className="mt-2 font-semibold text-foreground">No crews to discover</p>
              <p className="text-sm text-muted-foreground">Be the first — create one above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((crew, i) => (
                <motion.div
                  key={crew.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-2xl">
                    {crew.badge_emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardHeading as="p" className="font-semibold text-foreground truncate">{crew.name}</CardHeading>
                    {crew.description && (
                      <p className="text-xs text-muted-foreground truncate">{crew.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Users className="h-3 w-3" />
                      {crew.member_count}/{crew.max_members}
                      {crew.is_public ? <Globe className="h-3 w-3 ml-1" /> : <Lock className="h-3 w-3 ml-1" />}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={joinCrew.isPending || (crew.member_count ?? 0) >= crew.max_members}
                    onClick={() => handleJoin(crew)}
                  >
                    {(crew.member_count ?? 0) >= crew.max_members ? 'Full' : 'Join'}
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
