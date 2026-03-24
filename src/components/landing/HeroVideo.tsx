import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown } from 'lucide-react';
import logoTransparent from '@/assets/logo-transparent.png';

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.play().catch(() => {});
    }
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Fallback image */}
      <img
        src="/hero-fallback.jpg"
        alt=""
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden="true"
      />

      {/* Video */}
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
        src="/hero-video.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onCanPlayThrough={() => setVideoLoaded(true)}
        aria-hidden="true"
      />

      {/* Dark overlay ~25% */}
      <div className="absolute inset-0 bg-foreground/25" />

      {/* Content overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
      >
        {/* Pennant logo animation */}
        <motion.img
          src={logoTransparent}
          alt="Cubbies Buddies"
          initial={{ opacity: 0, scale: 0.55, y: -40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-6 w-full max-w-sm drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] sm:max-w-md lg:max-w-lg"
        />

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mb-4 text-4xl font-extrabold sm:text-5xl lg:text-6xl"
           style={{
             fontFamily: 'Montserrat, sans-serif',
             color: 'hsl(var(--brick-red))',
             WebkitTextStroke: '4px white',
             paintOrder: 'stroke fill',
             filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))',
             letterSpacing: '0.05em',
             lineHeight: 1.4,
           }}
         >
           Because 'Wait 'Til Next Year' Is Better With Friends.
         </motion.h1>

        {/* Subheadline */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mb-8 text-3xl sm:text-4xl lg:text-5xl"
           style={{
             fontFamily: "'Norwester', sans-serif",
             color: 'white',
             WebkitTextStroke: '2px hsl(var(--day-blue))',
             paintOrder: 'stroke fill',
             filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))',
             letterSpacing: '0.04em',
             lineHeight: 1.4,
             textTransform: 'none',
           }}
        >
          Stop Watching From the Sidelines.
        </motion.h2>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <Link to="/auth">
            <Button
              size="lg"
               className="rounded-full bg-secondary px-10 text-base font-bold shadow-lg hover:bg-secondary/90"
               aria-label="Join the Bleachers — sign up for Cubbies Buddies"
             >
               Join the Bleachers
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
