import { useRef, useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Eye } from 'lucide-react';
import wrigleyvilleLogo from '@/assets/wrigleyville-logo.png';
import { useGuestMode } from '@/contexts/GuestModeContext';

const VIDEO_SOURCES = ['/hero-video.mp4', '/hero-video-2.mp4', '/hero-video-3-v2.mp4'];

export default function HeroVideo() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const navigate = useNavigate();
  const { enterGuestMode } = useGuestMode();

  const setRef = useCallback(
    (idx: number) => (el: HTMLVideoElement | null) => {
      videoRefs.current[idx] = el;
    },
    [],
  );

  useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
      if (!v) return;
      if (idx === 0) {
        v.play().catch(() => {});
        setReady(true);
      } else {
        v.load();
      }
    });
  }, []);

  // Simulate a live count that feels organic
  useEffect(() => {
    const base = 38 + Math.floor(Math.random() * 20);
    setLiveCount(base);
    const interval = setInterval(() => {
      setLiveCount((prev) => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleEnded = useCallback((endedIndex: number) => {
    const nextIndex = (endedIndex + 1) % VIDEO_SOURCES.length;
    setActiveIndex(nextIndex);
    const nextVideo = videoRefs.current[nextIndex];
    if (nextVideo) {
      nextVideo.currentTime = 0;
      nextVideo.play().catch(() => {});
    }
  }, []);

  const handleBrowseAsGuest = () => {
    enterGuestMode();
    navigate('/vibe');
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Fallback image */}
      <img
        src="/hero-fallback.jpg"
        alt=""
        className={`absolute inset-0 h-full w-full object-cover ${ready ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden="true"
      />

      {/* Stacked videos */}
      {VIDEO_SOURCES.map((src, idx) => (
        <video
          key={src}
          ref={setRef(idx)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: activeIndex === idx && ready ? 1 : 0 }}
          src={src}
          muted
          playsInline
          preload="auto"
          onEnded={() => handleEnded(idx)}
          aria-hidden="true"
        />
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-foreground/35" />

      {/* Content overlay — clean three-section hierarchy */}
      <div className="relative z-10 mx-auto flex h-full max-w-md flex-col items-center justify-center px-6 text-center">
        {/* SECTION A — Title block */}
        <div className="flex flex-col items-center">
          <img
            src={wrigleyvilleLogo}
            alt="Wrigleyville 60613 Logo"
            className="w-full max-w-[260px] drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] sm:max-w-[300px]"
          />
          <h1
            className="mt-3 text-[1.35rem] sm:text-[1.6rem] font-bold uppercase tracking-[0.18em] text-white"
            style={{
              fontFamily: 'Norwester, sans-serif',
              textShadow: '0 2px 12px rgba(0,0,0,0.7)',
            }}
          >
            The Wrigleyville Social App
          </h1>
        </div>

        {/* Subtle divider */}
        <div className="my-7 h-px w-16 bg-white/25" />

        {/* SECTION B — Social proof + tagline (unified block) */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-sm font-medium text-white/95" style={{ fontFamily: 'Inter, sans-serif' }}>
              {liveCount} Buddies active near the Friendly Confines
            </span>
          </div>
          <p
            className="text-lg sm:text-xl font-bold uppercase tracking-[0.14em] text-white/95"
            style={{
              fontFamily: 'Norwester, sans-serif',
              textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            }}
          >
            Where fans find friends
          </p>
        </div>

        {/* Subtle divider */}
        <div className="my-7 h-px w-16 bg-white/25" />

        {/* SECTION C — CTA block */}
        <div className="flex w-full flex-col items-center gap-3">
          <Link to="/quick-start" className="w-full max-w-xs">
            <Button
              size="lg"
              className="w-full rounded-full bg-secondary px-10 py-4 text-lg font-bold shadow-lg hover:bg-secondary/90"
              aria-label="Get in the Game — sign up for Cubbies Buddies"
            >
              Get in the Game
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleBrowseAsGuest}
            className="w-full max-w-xs rounded-full px-8 font-medium text-white/85 hover:text-white hover:bg-white/10 gap-2"
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
