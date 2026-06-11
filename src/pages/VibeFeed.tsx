import { useState, useRef, useEffect } from 'react';
import { SEOMeta } from '@/components/SEOMeta';
import { WrigleyRainbowBackground } from '@/components/WrigleyRainbowBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { track } from '@/lib/analytics';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Video, MapPin, Clock, MessageCircle, X, Trash2, Plus, Image as ImageIcon, ArrowLeft, Zap } from 'lucide-react';
import { InviteBuddyButton } from '@/components/invite/InviteBuddyButton';
import { useNavigate } from 'react-router-dom';
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
import { WelcomeTour } from '@/components/WelcomeTour';
import { LiveVibeCheckIn } from '@/components/LiveVibeCheckIn';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { BuyBeerButton } from '@/components/beer/BuyBeerButton';
import { BuyBeerOnboardingTooltip } from '@/components/beer/BuyBeerOnboardingTooltip';
import { ReturnTheFavorBanner } from '@/components/beer/ReturnTheFavorBanner';
import { BeerShoutoutFeedCard } from '@/components/beer/BeerShoutoutFeedCard';
import { useBeerShoutouts } from '@/hooks/useBeerShoutouts';
import { useSearchParams } from 'react-router-dom';

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
      const { data, error } = await supabase.rpc('get_public_profiles', {
        p_user_ids: userIds,
      });
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
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [locationTag, setLocationTag] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [guestGateOpen, setGuestGateOpen] = useState(false);
  const [guestGateAction, setGuestGateAction] = useState('');
  const [fabVisible, setFabVisible] = useState(true);
  const [fabTap, setFabTap] = useState(false);
  const lastScrollY = useRef(0);
  const { isVerified } = useVerifiedFan();

  // Hide FAB on scroll-down, reveal on scroll-up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (Math.abs(delta) < 6) return;
      if (delta > 0 && y > 80) setFabVisible(false);
      else setFabVisible(true);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { data: posts = [], isLoading: postsLoading } = useVibePosts();
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

      track('vibe_post_created', {
        media_type: mediaType,
        has_caption: !!caption,
        has_location: !!locationTag,
      });
      toast.success('Vibe posted! ');
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

  // Empty-state analytics: view + CTA click for A/B conversion tracking
  const emptyStateViewedRef = useRef(false);
  useEffect(() => {
    if (!posts.length && !emptyStateViewedRef.current) {
      emptyStateViewedRef.current = true;
      try {
        window.dispatchEvent(new CustomEvent('cb:vibe_empty_state_view'));
        // @ts-ignore
        if (typeof window.gtag === 'function') window.gtag('event', 'vibe_empty_state_view');
        // @ts-ignore
        if (typeof window.plausible === 'function') window.plausible('Vibe Empty State View');
      } catch {}
    }
  }, [posts.length]);

  const trackDropVibeClick = (source: 'empty_state' | 'fab') => {
    try {
      window.dispatchEvent(new CustomEvent('cb:drop_vibe_click', { detail: { source } }));
      // @ts-ignore
      if (typeof window.gtag === 'function') window.gtag('event', 'drop_vibe_click', { source });
      // @ts-ignore
      if (typeof window.plausible === 'function') window.plausible('Drop a Vibe Click', { props: { source } });
    } catch {}
  };

  return (
    <WrigleyRainbowBackground>
      <SEOMeta
        title="Live Vibe Feed — Wrigleyville Right Now"
        description="See what's happening at Wrigley Field and Wrigleyville bars right now. Live photos, vibes, and shoutouts from Cubs fans."
      />
      {/* Lightening layer — keeps background tint at ~20-30%; non-blocking so feed stays scrollable */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, hsla(0,0%,100%,0.22) 0%, hsla(0,0%,100%,0.08) 45%, hsla(0,0%,0%,0.06) 100%)',
        }}
      />
      <AppHeader />

      <GuestGateModal open={guestGateOpen} onClose={() => setGuestGateOpen(false)} action={guestGateAction} />
      {isGuest && <WelcomeTour />}

      {/* Sticky top bar — Back / Title / Skip — always visible */}
      <div className="sticky top-0 z-30 w-full">
        <div className="mx-auto max-w-lg px-4 pt-2 pb-2 grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/home'))}
            aria-label="Go back"
            className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-background/75 backdrop-blur-md border border-border/60 shadow-sm text-foreground hover:bg-background/90 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1
            className="text-center text-lg font-extrabold tracking-wide"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              color: '#FFFFFF',
              fontWeight: 800,
              textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.9)',
              letterSpacing: '0.04em',
            }}
          >
            Live Vibe Feed
          </h1>
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-background/65 backdrop-blur-md border border-border/50 text-sm font-medium text-foreground/90 hover:bg-background/85 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>

      <main className={`mx-auto max-w-lg px-4 pt-2 ${isGuest ? 'pb-32' : 'pb-28'}`} data-tour="vibe-feed">
        <Tabs defaultValue="vibes" className="mb-4">
          <TabsList className="w-full grid grid-cols-2 mb-4" data-tour="check-in">
            <TabsTrigger value="vibes" className="gap-1.5">
              <Camera className="h-3.5 w-3.5" /> Live Vibes
            </TabsTrigger>
            <TabsTrigger value="memories" className="gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> Memories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vibes">
        {/* Reciprocity nudges from recent gifts to this user */}
        <ReturnTheFavorBanner className="mb-3" />

        {/* Recent public beer shoutouts */}
        <BeerShoutoutsStrip />

        {/* Subheader */}
        <p
          className="text-center text-sm font-semibold mb-3"
          style={{
            color: '#FFFFFF',
            textShadow: '0 1px 6px rgba(0,0,0,0.75), 0 2px 4px rgba(0,0,0,0.6)',
          }}
        >
          What's happening at Wrigley right now
        </p>

        {/* Live Vibe Check-In */}
        {!isGuest && user && (
          <div className="mb-4">
            <LiveVibeCheckIn />
          </div>
        )}

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
                      <img src={preview} className="w-full h-full object-cover" alt="Preview" loading="lazy" decoding="async" />
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
                  {uploading ? 'Posting…' : 'Post to Vibe Feed '}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed */}
        {postsLoading ? (
          <div className="space-y-4" aria-label="Loading vibes">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-2.5 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <div
              className="mb-4 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px' }}
            >
              <Zap size={48} style={{ color: '#FFFFFF' }} strokeWidth={1.75} />
            </div>
            <p className="text-[18px] font-medium" style={{ color: '#FFFFFF', fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              No vibes yet today
            </p>
            <p className="mt-1.5 max-w-[300px] text-sm" style={{ color: 'rgba(255, 255, 255, 0.90)', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
              Be the first to post — what's the energy like at Wrigley right now?
            </p>
            <Button
              onClick={() => {
                trackDropVibeClick('empty_state');
                if (isGuest) return triggerGuestGate('post photos and videos');
                if (!isVerified) return navigate('/verify');
                setShowCompose(true);
              }}
              className="mt-5"
              variant="default"
            >
              Post a Vibe
            </Button>
            <InviteBuddyButton source="empty-state" variant="empty-state" />
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => {
              const profile = profiles[post.user_id];
              const isOwn = post.user_id === user?.id;
              return (
                <div
                  key={post.id}
                  className="animate-vibe-in"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <Card className="overflow-hidden border-border/60 shadow-md">
                    {/* Media */}
                    <div className="relative aspect-[4/3] bg-muted">
                      {post.media_type === 'video' ? (
                        <video src={post.media_url} className="w-full h-full object-cover" controls playsInline />
                      ) : (
                        <img src={post.media_url} className="w-full h-full object-cover" alt={post.location_tag} loading="lazy" decoding="async" />
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
                              Enter the Bleachers
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

                      {/* Buy a Round for this post — targets the poster */}
                      {!isOwn && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <BuyBeerButton
                            context={{
                              kind: 'fan',
                              userId: post.user_id,
                              firstName: profile?.display_name?.split(' ')[0],
                            }}
                            label={`Buy a Round for ${profile?.display_name?.split(' ')[0] || 'this fan'}`}
                            variant="outline"
                            size="sm"
                            showMicrocopy
                            className="w-full rounded-xl"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
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

      {/* Floating Drop-a-Vibe FAB — centered above bottom nav */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
          transition: 'opacity 180ms ease-out, transform 180ms ease-out',
          opacity: fabVisible ? 1 : 0,
          transform: `translateX(-50%) translateY(${fabVisible ? 0 : 20}px)`,
        }}
      >
        <button
          onClick={() => {
            setFabTap(true);
            setTimeout(() => setFabTap(false), 340);
            trackDropVibeClick('fab');
            if (isGuest) return triggerGuestGate('post photos and videos');
            if (!isVerified) return navigate('/verify');
            setShowCompose(true);
          }}
          aria-label="Drop a Vibe"
          className={`pointer-events-auto inline-flex items-center gap-2 h-14 px-6 rounded-full bg-accent text-accent-foreground font-bold shadow-elevated border border-accent/40 hover:bg-accent/90 ${
            fabTap ? 'animate-fab-tap' : 'animate-fab-breath'
          } animate-fab-enter`}
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm tracking-wide">Drop a Vibe</span>
        </button>
      </div>

      {isGuest && <GuestBanner />}
      <BuyBeerOnboardingTooltip />
    </WrigleyRainbowBackground>
  );
}

function BeerShoutoutsStrip() {
  const { data: items = [] } = useBeerShoutouts(8);
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('shoutout');

  // Auto-scroll to a deep-linked shoutout
  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`shoutout-${highlightId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, items.length]);

  if (items.length === 0) return null;
  return (
    <div className="space-y-2 mb-3">
      {items.map((s) => (
        <BeerShoutoutFeedCard
          key={s.id}
          shoutout={s}
          highlighted={highlightId === s.id}
        />
      ))}
    </div>
  );
}

