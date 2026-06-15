import { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Eye } from 'lucide-react';
import wrigleyvilleLogo from '@/assets/wrigleyville-logo.webp';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { supabase } from '@/integrations/supabase/client';

const MIN_LIVE_COUNT_TO_SHOW = 25;
const VIDEO_SRC = '/hero-video.mp4';
const POSTER_SRC = '/hero-fallback.jpg';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const navigate = useNavigate();
  const { enterGuestMode } = useGuestMode();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, [reducedMotion]);

  // Real fan-activity count from the last 7 days. Hidden if below threshold
  // so we never show a small/embarrassing number.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('get_active_fan_count_7d');
      if (cancelled) return;
      if (error || typeof data !== 'number') {
        setLiveCount(null);
        return;
      }
      setLiveCount(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBrowseAsGuest = () => {
    enterGuestMode();
    navigate('/vibe');
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Poster — shown instantly, fades out once video starts */}
      <img
        src={POSTER_SRC}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${ready && !reducedMotion ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />

      {!reducedMotion && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          muted
          loop
          playsInline
          preload="metadata"
          onPlaying={() => setReady(true)}
          aria-hidden="true"
        />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-foreground/40" />

      {/* Content overlay — three tight stacked blocks */}
      <div className="relative z-10 mx-auto flex h-full max-w-md flex-col items-center justify-center px-6 text-center">
        {/* BLOCK 1 — Marquee title */}
        <div className="flex flex-col items-center">
          <img
            src={wrigleyvilleLogo}
            alt="Wrigleyville 60613 Logo"
            className="w-full max-w-[260px] drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] sm:max-w-[300px]" loading="eager" fetchPriority="high" decoding="async" />

          <h1
            className="mt-2 text-[1.25rem] sm:text-[1.5rem] font-bold uppercase tracking-[0.2em] text-white"
            style={{
              fontFamily: 'Norwester, sans-serif',
              textShadow: '0 2px 12px rgba(0,0,0,0.7)',
            }}
          >
            The Wrigleyville Social App
          </h1>
        </div>

        {/* BLOCK 2 — Unified social proof + tagline */}
        <div className="mt-8 flex flex-col items-center gap-2.5">
          {liveCount !== null && liveCount >= MIN_LIVE_COUNT_TO_SHOW && (
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-[13px] font-medium text-white/95" style={{ fontFamily: 'Inter, sans-serif' }}>
                {liveCount} Buddies active near the Friendly Confines this week
              </span>
            </div>
          )}
          <p
            className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] text-white"
            style={{
              fontFamily: 'Norwester, sans-serif',
              textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            }}
          >
            Where fans find friends
          </p>
        </div>

        {/* BLOCK 3 — CTA stack */}
        <div className="mt-8 flex w-full flex-col items-center gap-2.5">
          <Link to="/quick-start" className="w-full max-w-xs">
            <Button
              size="lg"
              className="w-full rounded-full bg-secondary px-10 text-lg font-bold shadow-lg hover:bg-secondary/90"
              aria-label="Get in the Game — sign up for Wrigleyville Buddies"
            >
              Get in the Game
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={handleBrowseAsGuest}
            className="w-full max-w-xs rounded-full font-medium text-white/85 hover:text-white hover:bg-white/10 gap-2"
          >
            <Eye className="h-4 w-4" />
            Browse as Guest
          </Button>
        </div>
      </div>

      {/* Scroll cue — simple CSS animation instead of framer-motion */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-8 w-8 text-white/70 drop-shadow-lg" />
      </div>
    </section>
  );
}
