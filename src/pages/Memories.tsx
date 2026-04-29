import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, MapPin, Users, Heart, Trash2, ChevronRight, Sparkles, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const LOCATION_TAGS = [
  'Wrigley Field',
  'Murphy\'s Bleachers',
  'Cubby Bear',
  'Tailgate Lot',
  'Sluggers',
  'Watch Party',
  'Wrigleyville',
];

export default function Memories() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [locationTag, setLocationTag] = useState(LOCATION_TAGS[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<{ id: string; name: string; photo: string }[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Fetch memories
  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['game-memories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_memories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch profiles for display
  const userIds = [...new Set(memories.map(m => m.user_id))];
  const taggedIds = [...new Set(memories.flatMap(m => (m.tagged_users as string[]) || []))];
  const allProfileIds = [...new Set([...userIds, ...taggedIds])];

  const { data: profileMap = {} } = useQuery({
    queryKey: ['memory-profiles', allProfileIds.join(',')],
    queryFn: async () => {
      if (allProfileIds.length === 0) return {};
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo')
        .in('user_id', allProfileIds);
      const map: Record<string, { display_name: string; profile_photo: string | null }> = {};
      data?.forEach(p => { map[p.user_id] = p; });
      return map;
    },
    enabled: allProfileIds.length > 0,
  });

  // Search for taggable users
  const { data: searchResults = [] } = useQuery({
    queryKey: ['tag-search', tagSearch],
    queryFn: async () => {
      if (tagSearch.length < 2) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo')
        .ilike('display_name', `%${tagSearch}%`)
        .neq('user_id', user?.id ?? '')
        .limit(5);
      return data ?? [];
    },
    enabled: tagSearch.length >= 2,
  });

  // Auto-generated game day stats
  const { data: dayStats } = useQuery({
    queryKey: ['game-day-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Matches made today
      const { count: matchCount } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .gte('created_at', todayISO);

      // Hi-fives sent today
      const { count: hiFiveCount } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('from_user', user.id)
        .eq('is_hi_five', true)
        .gte('created_at', todayISO);

      // Memories shared today
      const { count: memoryCount } = await supabase
        .from('game_memories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayISO);

      return {
        newFans: matchCount ?? 0,
        hiFives: hiFiveCount ?? 0,
        memories: memoryCount ?? 0,
      };
    },
    enabled: !!user,
  });

  // Upload memory
  const uploadMemory = useMutation({
    mutationFn: async () => {
      if (!user || !selectedFile) throw new Error('Missing file');
      setUploading(true);

      const ext = selectedFile.name.split('.').pop();
      const path = `${user.id}/memory-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('vibe-media')
        .upload(path, selectedFile, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('vibe-media').getPublicUrl(path);

      const { error } = await supabase.from('game_memories').insert({
        user_id: user.id,
        media_url: urlData.publicUrl,
        caption: caption || null,
        location_tag: locationTag,
        tagged_users: taggedUsers.map(u => u.id),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(' Memory saved!');
      setShowUpload(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      setTaggedUsers([]);
      queryClient.invalidateQueries({ queryKey: ['game-memories'] });
      queryClient.invalidateQueries({ queryKey: ['game-day-stats'] });
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setUploading(false),
  });

  const deleteMemory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('game_memories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Memory deleted');
      queryClient.invalidateQueries({ queryKey: ['game-memories'] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowUpload(true);
  };

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      <div className="mx-auto max-w-lg px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">
              Game Memories
            </h1>
            <p className="text-xs text-muted-foreground">Capture & share your game day moments</p>
          </div>
          <label className="cursor-pointer">
            <Button size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground" asChild>
              <span>
                <Camera className="h-4 w-4" />
                Add Memory
              </span>
            </Button>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
          </label>
        </div>

        {/* Game Day Story — auto-generated stats */}
        {dayStats && (dayStats.newFans > 0 || dayStats.hiFives > 0 || dayStats.memories > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-primary/5 p-4 overflow-hidden relative"
          >
            <div className="absolute top-2 right-2 opacity-10 text-6xl pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-accent/20">
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <span className="text-sm font-bold text-accent">
                Your Game Day Story
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {dayStats.newFans > 0 && (
                <div className="text-center rounded-xl bg-card/60 backdrop-blur-sm p-3 border border-border/50">
                  <p className="text-2xl font-bold text-foreground">{dayStats.newFans}</p>
                  <p className="text-[10px] font-medium text-muted-foreground mt-0.5">New Fans Met</p>
                </div>
              )}
              {dayStats.hiFives > 0 && (
                <div className="text-center rounded-xl bg-card/60 backdrop-blur-sm p-3 border border-border/50">
                  <p className="text-2xl font-bold text-foreground">{dayStats.hiFives}</p>
                  <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Hi-Fives</p>
                </div>
              )}
              {dayStats.memories > 0 && (
                <div className="text-center rounded-xl bg-card/60 backdrop-blur-sm p-3 border border-border/50">
                  <p className="text-2xl font-bold text-foreground">{dayStats.memories}</p>
                  <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Memories</p>
                </div>
              )}
            </div>

            {dayStats.newFans > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-foreground/80 mt-3 text-center font-medium"
              >
                 You met {dayStats.newFans} new fan{dayStats.newFans !== 1 ? 's' : ''} today!
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Upload overlay */}
        <AnimatePresence>
          {showUpload && previewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mb-4 rounded-2xl border border-border bg-card overflow-hidden shadow-lg"
            >
              {/* Preview */}
              <div className="relative aspect-video bg-muted">
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              </div>

              <div className="p-4 space-y-3">
                {/* Caption */}
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />

                {/* Location tag */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"> Location</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {LOCATION_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setLocationTag(tag)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-all ${
                          locationTag === tag
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-foreground hover:border-primary/40'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tag people */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"> Tag People</p>

                  {taggedUsers.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {taggedUsers.map(tu => (
                        <span key={tu.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {tu.name}
                          <button onClick={() => setTaggedUsers(prev => prev.filter(u => u.id !== tu.id))} className="hover:text-destructive">×</button>
                        </span>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Search fans to tag..."
                    value={tagSearch}
                    onChange={e => setTagSearch(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />

                  {searchResults.length > 0 && tagSearch.length >= 2 && (
                    <div className="mt-1.5 rounded-xl border border-border bg-card overflow-hidden">
                      {searchResults.map(sr => (
                        <button
                          key={sr.user_id}
                          onClick={() => {
                            if (!taggedUsers.find(t => t.id === sr.user_id)) {
                              setTaggedUsers(prev => [...prev, { id: sr.user_id, name: sr.display_name, photo: sr.profile_photo || '' }]);
                            }
                            setTagSearch('');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={sr.profile_photo || ''} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">{sr.display_name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">{sr.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1 rounded-full bg-primary text-primary-foreground font-semibold"
                    disabled={uploading}
                    onClick={() => uploadMemory.mutate()}
                  >
                    {uploading ? 'Saving...' : ' Save Memory'}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Memories Feed */}
        {isLoading ? (
          <div className="py-16 text-center">
            <p className="text-4xl animate-pulse"></p>
            <p className="mt-2 text-sm font-medium text-muted-foreground">Loading memories...</p>
          </div>
        ) : memories.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No memories yet</p>
            <p className="text-sm text-muted-foreground mt-1">Capture your first game day moment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map((memory, idx) => {
              const author = profileMap[memory.user_id];
              const tagged = ((memory.tagged_users as string[]) || [])
                .map(id => profileMap[id])
                .filter(Boolean);
              const isOwn = memory.user_id === user?.id;

              return (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
                >
                  {/* Author header */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarImage src={author?.profile_photo || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {(author?.display_name || '?')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{author?.display_name || 'Fan'}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(memory.created_at)}</p>
                    </div>
                    {isOwn && (
                      <button
                        onClick={() => deleteMemory.mutate(memory.id)}
                        className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>

                  {/* Photo */}
                  <div className="aspect-video bg-muted">
                    <img src={memory.media_url} alt={memory.caption || 'Game memory'} className="h-full w-full object-cover" />
                  </div>

                  {/* Details */}
                  <div className="px-3 py-2.5 space-y-1.5">
                    {memory.caption && (
                      <p className="text-sm text-foreground leading-snug">{memory.caption}</p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {memory.location_tag}
                      </span>

                      {tagged.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          with {tagged.map(t => t.display_name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
