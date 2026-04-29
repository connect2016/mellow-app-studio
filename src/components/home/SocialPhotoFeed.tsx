import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Camera, ChevronRight } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface VibePost {
  id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  location_tag: string;
  created_at: string;
}

export function SocialPhotoFeed() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['home-vibe-feed'],
    queryFn: async (): Promise<VibePost[]> => {
      const { data } = await supabase
        .from('vibe_posts')
        .select('id, media_url, media_type, caption, location_tag, created_at')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(8);
      return data ?? [];
    },
    refetchInterval: 60_000,
  });

  return (
    <section aria-labelledby="photo-feed-heading" className="mb-5">
      <div className="flex items-baseline justify-between mb-2.5 px-1">
        <h2 id="photo-feed-heading" className="text-lg font-bold text-destructive-foreground text-on-image flex items-center gap-1.5">
          <Camera className="h-4 w-4 text-white" /> Live from Wrigleyville
        </h2>
        <Link
          to="/vibe"
          className="text-xs font-semibold text-on-image hover:underline flex items-center gap-0.5"
        >
          See feed <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card/90 p-6 text-center text-sm text-destructive-foreground">
          Loading photos…
        </div>
      ) : posts.length === 0 ? (
        <Link
          to="/vibe"
          className="block rounded-2xl border border-dashed border-border bg-card/90 p-5 text-center"
        >
          <p className="text-2xl mb-1"><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></p>
          <p className="text-sm font-bold text-destructive-foreground">No photos yet tonight</p>
          <p className="text-sm text-destructive-foreground mt-0.5">Be the first to share a moment</p>
        </Link>
      ) : (
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-none snap-x snap-mandatory">
          {posts.map((p) => (
            <Link
              key={p.id}
              to="/vibe"
              className="snap-start shrink-0 relative w-32 h-40 rounded-2xl overflow-hidden border border-border shadow-sm transition active:scale-[0.97] hover:shadow-md group"
              aria-label={`Photo from ${p.location_tag}`}
            >
              {p.media_type === 'video' ? (
                <video src={p.media_url} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <img src={p.media_url} alt={p.caption ?? p.location_tag} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
                <p className="text-[10px] font-bold text-white truncate"><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> {p.location_tag}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
