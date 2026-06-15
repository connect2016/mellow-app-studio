import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight } from 'lucide-react';
import bgBleachers from '@/assets/bg-cubs-fans-celebrating.webp'; // 1920x1171 (was 704x897 bg-bleachers.webp)
import bgField from '@/assets/bg-field.webp'; // 1920x1080
import bgParade from '@/assets/cubs-fans-parade.webp'; // 1920x1279
// bg-rizzo removed: avoided player-likeness exposure
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const FLASHBACKS = [
  {
    image: bgBleachers,
    caption: 'The Bleachers — Where legends are made',
    era: 'Wrigley Field',
  },
  {
    image: bgField,
    caption: 'Under the lights at the Friendly Confines',
    era: 'Game Day',
  },
  {
    image: bgParade,
    caption: 'Cubs pride runs deep in Wrigleyville',
    era: 'Fan Favorites',
  },
];

export function OffDayFlashback() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % FLASHBACKS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const flashback = FLASHBACKS[current];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border border-border"
    >
      {/* Vintage photo */}
      <div className="relative h-48 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={flashback.image}
            alt={flashback.caption}
            className="h-full w-full object-cover"
            width={800}
            height={512}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8 }}
          />
        </AnimatePresence>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Era badge */}
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm"
            style={{
              background: 'hsla(40, 15%, 88%, 0.85)',
              color: 'hsl(var(--ivy-green))',
              fontFamily: "'Rye', cursive",
            }}
          >
             Flashback
          </span>
        </div>

        {/* Caption */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xs font-semibold text-white/90">{flashback.caption}</p>
          <p className="text-[9px] text-white/60 font-scoreboard uppercase tracking-wider mt-0.5">
            {flashback.era}
          </p>
        </div>

        {/* Dots */}
        <div className="absolute bottom-3 right-3 flex gap-1">
          {FLASHBACKS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === current ? 'bg-white w-4' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'hsl(var(--card))' }}
      >
        <div>
          <p
            className="text-sm font-bold text-foreground"
            style={{ fontFamily: "'Rye', cursive" }}
          >
            Off Day — Plan Your Next Outing
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Browse upcoming games & set your crew plans
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/game-day')}
          className="rounded-xl gap-1 text-xs"
        >
          <Calendar className="h-3.5 w-3.5" />
          Plan
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}
