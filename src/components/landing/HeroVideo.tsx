import { useRef, useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Eye } from 'lucide-react';
import logoTransparent from '@/assets/logo-transparent.png';
import { useGuestMode } from '@/contexts/GuestModeContext';

const VIDEO_SOURCES = ['/hero-video.mp4', '/hero-video-2.mp4', '/hero-video-3-v2.mp4'];

export default function HeroVideo() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ready, setReady] = useState(false);
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

        <h1
          className="text-[1.6rem] font-extrabold sm:text-4xl lg:text-5xl"
          style={{
            fontFamily: 'Graduate, serif',
            color: 'white',
            WebkitTextStroke: '1.5px black',
            paintOrder: 'stroke fill',
            textShadow: '0 2px 20px rgba(0,0,0,0.6)',
            letterSpacing: '0.02em',
            lineHeight: 1.2,
            textWrap: 'balance',
          }}
        >
          The Wrigleyville
          <br />
          Connection{' '}
          <span style={{ color: 'hsl(var(--secondary))' }}>Clubhouse</span>
        </h1>

        <p
          className="mt-3 max-w-md text-base font-medium sm:text-lg"
          style={{
            fontFamily: 'Inter, sans-serif',
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          }}
        >
          Where solo fans become gameday friends.
        </p>

        <p
          className="mt-2 mb-0 text-sm font-semibold tracking-wide uppercase"
          style={{
            color: 'rgba(255,255,255,0.65)',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            letterSpacing: '0.12em',
            paddingBottom: '2rem',
          }}
        >
          Safe · Simple · Built for real fans
        </p>

        <div className="flex flex-col items-center gap-3">
          <Link to="/auth">
            <Button
              size="lg"
              className="rounded-full bg-secondary px-10 font-bold shadow-lg hover:bg-secondary/90"
              aria-label="Get Started — sign up for Cubbies Buddies"
            >
              Get Started — 30 Seconds
              <ChevronRight className="ml-1 h-4 w-4" />
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
