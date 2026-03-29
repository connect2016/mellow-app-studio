import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Video, MapPin, Clock, MessageCircle, X, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { WRIGLEYVILLE_BARS } from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MemoriesContent from '@/components/MemoriesContent';
import { useVerifiedFan } from '@/hooks/useVerifiedFan';
import { VerifiedGate } from '@/components/VerifiedGate';
import { GuestGateModal } from '@/components/GuestGateModal';
import { GuestBanner } from '@/components/GuestBanner';

const LOCATION_OPTIONS = [
  ...WRIGLEYVILLE_BARS.map(b => b.name),
  'Section 100', 'Section 110', 'Section 120', 'Section 130', 'Section 140',
  'Section 200', 'Section 210', 'Section 220', 'Section 228', 'Section 230',
  'Section 300', 'Section 310', 'Section 320', 'Section 330',
  'Bleachers', 'Rooftop', 'Gallagher Way',
];

function useVibePosts() {
  return useQuery({
    queryKey: ['vibe-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vibe_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });
}

function useVibeProfiles(userIds: string[]) {
  return useQuery({
    queryKey: ['vibe-profiles', userIds.sort().join(',')],
    queryFn: async () => {
      if (!userIds.length) return {};
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, profile_photo')
        .in('user_id', userIds);
      if (error) throw error;
      const map: Record<string, { display_name: string; profile_photo: string | null }> = {};
      data?.forEach(p => { map[p.user_id] = p; });
      return map;
    },
    enabled: userIds.length > 0,
  });
}

export default function VibeFeed() {
  const { user } = useAuth();
  const { isGuest } = useGuestMode();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [locationTag, setLocationTag] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [guestGateOpen, setGuestGateOpen] = useState(false);
  const [guestGateAction, setGuestGateAction] = useState('');
  const { isVerified } = useVerifiedFan();

  const { data: posts = [] } = useVibePosts();
  const userIds = [...new Set(posts.map(p => p.user_id))];
  const { data: profiles = {} } = useVibeProfiles(userIds);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isVideo = f.type.startsWith('video/');
    if (isVideo && f.size > 50 * 1024 * 1024) {
      toast.error('Video must be under 50MB');
      return;
    }
    if (!isVideo && f.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handlePost = async () => {
    if (!isVerified) {
      toast.error('Only Verified Fans can post. Get verified first!');
      return;
    }
    if (!user || !file || !locationTag) {
      toast.error('Please select a file and location');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('vibe-media').upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('vibe-media').getPublicUrl(path);
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

      const { error } = await supabase.from('vibe_posts').insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: mediaType,
        location_tag: locationTag,
        caption: caption || null,
      });
      if (error) throw error;

      toast.success('Vibe posted! 🎉');
      setShowCompose(false);
      setFile(null);
      setPreview(null);
      setLocationTag('');
      setCaption('');
      queryClient.invalidateQueries({ queryKey: ['vibe-posts'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to post');
    } finally {
      setUploading(false);
    }
  };

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('vibe_posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibe-posts'] });
      toast.success('Post deleted');
    },
  });

  const triggerGuestGate = (action: string) => {
    setGuestGateAction(action);
    setGuestGateOpen(true);
  };

  const joinTheVibe = async (creatorId: string) => {
    if (!user) {
      triggerGuestGate('join the vibe and chat with fans');
      return;
    }
    if (creatorId === user.id) {
      toast.info("That's your own post!");
      return;
    }
    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_a.eq.${user.id},participant_b.eq.${creatorId}),and(participant_a.eq.${creatorId},participant_b.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      window.location.href = `/messages?chat=${existing.id}`;
      return;
    }

    const a = user.id < creatorId ? user.id : creatorId;
    const b = user.id < creatorId ? creatorId : user.id;
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ participant_a: a, participant_b: b })
      .select('id')
      .single();
    if (error) {
      toast.error('Could not start conversation');
      return;
    }
    window.location.href = `/messages?chat=${conv.id}`;
  };

  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-lg px-4 pt-4 pb-24">
        <Tabs defaultValue="vibes" className="mb-4">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="vibes" className="gap-1.5">
              <Camera className="h-3.5 w-3.5" /> Live Vibes
            </TabsTrigger>
            <TabsTrigger value="memories" className="gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> Memories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vibes">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Live Vibe Feed</h1>
            <p className="text-sm text-muted-foreground mt-0.5">What's happening at Wrigley right now</p>
          </div>
          {isVerified ? (
            <Button
              onClick={() => setShowCompose(true)}
              className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" /> Post
            </Button>
          ) : (
            <Button
              onClick={() => window.location.href = '/verify'}
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5 text-xs"
            >
              ✅ Get Verified to Post
            </Button>
          )}
        </div>

        {/* Compose Modal */}
        <AnimatePresence>
          {showCompose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
              onClick={() => setShowCompose(false)}
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-6 space-y-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold font-heading text-foreground">Share Your Vibe</h2>
                  <button onClick={() => setShowCompose(false)} className="p-1 rounded-full hover:bg-muted">
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                {/* File picker */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {preview ? (
                  <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-muted">
                    {file?.type.startsWith('video/') ? (
                      <video src={preview} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                    )}
                    <button
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-3 transition-colors"
                  >
                    <div className="flex gap-3">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">Tap to add a photo or video</span>
                  </button>
                )}

                {/* Location */}
                <Select value={locationTag} onValueChange={setLocationTag}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      <SelectValue placeholder="Tag your location" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {LOCATION_OPTIONS.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Caption */}
                <Textarea
                  placeholder="What's the vibe? (optional)"
                  value={caption}
                  onChange={e => setCaption(e.target.value.slice(0, 140))}
                  className="resize-none h-20"
                />
                <p className="text-xs text-muted-foreground text-right -mt-2">{caption.length}/140</p>

                <Button
                  onClick={handlePost}
                  disabled={!file || !locationTag || uploading}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                >
                  {uploading ? 'Posting…' : 'Post to Vibe Feed 🎶'}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">📸</div>
            <h3 className="text-lg font-semibold text-foreground mb-1">The bleachers are empty</h3>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              Be the first to start a rally. Drop a vibe and get this section going!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => {
              const profile = profiles[post.user_id];
              const isOwn = post.user_id === user?.id;
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden border-border/60">
                    {/* Media */}
                    <div className="relative aspect-[4/3] bg-muted">
                      {post.media_type === 'video' ? (
                        <video src={post.media_url} className="w-full h-full object-cover" controls playsInline />
                      ) : (
                        <img src={post.media_url} className="w-full h-full object-cover" alt={post.location_tag} />
                      )}
                      {/* Expiry badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                        <Clock className="h-3 w-3" />
                        {timeLeft(post.expires_at)}
                      </div>
                      {/* Location badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                        <MapPin className="h-3 w-3 text-accent" />
                        {post.location_tag}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile?.profile_photo || ''} />
                            <AvatarFallback className="text-xs bg-muted">
                              {(profile?.display_name || '?')[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">
                              {profile?.display_name || 'Fan'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isOwn && (
                            <Button
                              size="sm"
                              onClick={() => joinTheVibe(post.user_id)}
                              className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full text-xs font-semibold gap-1.5"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Join the Vibe
                            </Button>
                          )}
                          {isOwn && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deletePost.mutate(post.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {post.caption && (
                        <p className="text-sm text-foreground mt-2.5">{post.caption}</p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
          </TabsContent>

          <TabsContent value="memories">
            <MemoriesContent />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
