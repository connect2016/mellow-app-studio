import { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown } from 'lucide-react';
import logoTransparent from '@/assets/logo-transparent.png';

const VIDEO_SOURCES = ['/hero-video.mp4', '/hero-video-2.mp4', '/hero-video-3.mp4'];

export default function HeroVideo() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const setRef = useCallback(
    (idx: number) => (el: HTMLVideoElement | null) => {
      videoRefs.current[idx] = el;
    },
    [],
  );

  // Start first video and pre-buffer all others
  useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
      if (!v) return;
      if (idx === 0) {
        v.play().catch(() => {});
        setReady(true);
      } else {
        // Pre-buffer by loading and immediately pausing
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

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Fallback image */}
      <img
        src="/hero-fallback.jpg"
        alt=""
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden="true"
      />

      {/* Stacked videos */}
      {VIDEO_SOURCES.map((src, idx) => (
        <video
          key={src}
          ref={setRef(idx)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          style={{ opacity: activeIndex === idx && ready ? 1 : 0 }}
          src={src}
          muted
          playsInline
          preload={idx === 0 ? 'auto' : 'metadata'}
          onEnded={() => handleEnded(idx)}
          aria-hidden="true"
        />
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-foreground/25" />

      {/* Content overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <motion.img
          src={logoTransparent}
          alt="Cubbies Buddies"
          initial={{ opacity: 0, scale: 0.55, y: -40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-6 w-full max-w-sm drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] sm:max-w-md lg:max-w-lg"
        />

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mb-4 text-4xl font-extrabold sm:text-5xl lg:text-6xl"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            color: 'hsl(var(--secondary))',
            WebkitTextStroke: '4px white',
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))',
            letterSpacing: '0.05em',
            lineHeight: 1.4,
          }}
        >
          Your Wrigleyville Connection Hub
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mb-8 text-3xl sm:text-4xl lg:text-5xl"
          style={{
            fontFamily: "'Norwester', sans-serif",
            color: 'white',
            WebkitTextStroke: '2px hsl(var(--cubs-blue))',
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))',
            letterSpacing: '0.04em',
            lineHeight: 1.4,
            textTransform: 'none',
          }}
        >
          Sync. Meet. Celebrate.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <Link to="/auth">
            <Button
              size="lg"
              className="rounded-full bg-secondary px-10 text-base font-bold shadow-lg hover:bg-secondary/90"
              aria-label="Get in the Game — sign up for Cubbies Buddies"
            >
              Get in the Game
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-8 w-8 text-primary-foreground/70 drop-shadow-lg" />
        </motion.div>
      </motion.div>
    </section>
  );
}
