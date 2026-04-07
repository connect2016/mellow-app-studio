import { useRef, useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Eye } from 'lucide-react';
import logoTransparent from '@/assets/logo-transparent.png';
import { useGuestMode } from '@/contexts/GuestModeContext';

const VIDEO_SOURCES = ['/hero-video.mp4', '/hero-video-2.mp4', '/hero-video-3-v2.mp4'];

/* Layered title style: each line renders 3 stacked elements —
   bottom = black stroke (thinnest outer trim), middle = white stroke, top = color fill */
const titleFont: React.CSSProperties = {
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontWeight: 900,
  fontSize: 'clamp(3rem, 9vw, 5.5rem)',
  lineHeight: 1.1,
  letterSpacing: '-0.02em',
};

function StrokedTitle({ text, color }: { text: string; color: string }) {
  const layerStyle: React.CSSProperties = {
    ...titleFont,
    gridArea: '1/1',
    textAlign: 'center',
  };
  return (
    <div style={{ display: 'grid' }}>
      {/* Layer 1: thin black outer trim */}
      <span aria-hidden="true" style={{ ...layerStyle, color: 'transparent', WebkitTextStroke: '10px hsl(0 0% 0%)', paintOrder: 'stroke fill' }}>{text}</span>
      {/* Layer 2: thick white outline */}
      <span aria-hidden="true" style={{ ...layerStyle, color: 'transparent', WebkitTextStroke: '7px hsl(0 0% 100%)', paintOrder: 'stroke fill' }}>{text}</span>
      {/* Layer 3: color fill */}
      <span style={{ ...layerStyle, color }}>{text}</span>
    </div>
  );
}

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

      {/* Content overlay — no motion, renders instantly */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-4 text-center">
        <img
          src={logoTransparent}
          alt="Cubbies Buddies"
          className="mb-4 w-full max-w-[280px] drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] sm:max-w-sm"
        />

        <h1 className="flex flex-col items-center gap-1">
          <StrokedTitle text="Your Wrigleyville" color="hsl(350, 85%, 50%)" />
          <StrokedTitle text="Connection Hub" color="hsl(222, 82%, 40%)" />
        </h1>

        <div className="mt-2 flex items-center gap-2 rounded-full bg-black/30 px-4 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <span className="text-sm font-medium text-white/90" style={{ fontFamily: 'Inter, sans-serif' }}>
            {liveCount} Buddies active near the Friendly Confines
          </span>
        </div>

        <p
          className="mt-3 max-w-md text-xl sm:text-2xl font-bold tracking-wider uppercase"
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontVariant: 'small-caps',
            color: 'rgba(255,255,255,0.95)',
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            letterSpacing: '0.08em',
            paddingBottom: '2rem',
          }}
        >
          Sync. Meet. Celebrate.
        </p>

        <div className="flex flex-col items-center gap-3">
          <Link to="/welcome">
            <Button
              size="lg"
              className="rounded-full bg-secondary px-10 py-4 text-lg font-bold shadow-lg hover:bg-secondary/90"
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
            className="rounded-full px-8 font-medium text-white/80 hover:text-white hover:bg-white/10 gap-2"
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
