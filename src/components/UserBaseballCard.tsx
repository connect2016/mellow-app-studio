import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import cardTemplate from '@/assets/baseball-card-template.png';
import { REACTIONS, ReactionDef } from '@/components/reactions/reactionData';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';

interface UserBaseballCardProps {
  profileImage?: string | null;
  displayName: string;
  className?: string;
  onClick?: () => void;
  badges?: string[];
  stats?: Record<string, number>;
  showReactions?: boolean;
}

export function UserBaseballCard({
  profileImage,
  displayName,
  className,
  onClick,
  showReactions = true,
}: UserBaseballCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeReactions, setActiveReactions] = useState<ReactionDef[]>([]);

  const handleReact = (reaction: ReactionDef) => {
    if (activeReactions.find(r => r.key === reaction.key)) {
      setActiveReactions(prev => prev.filter(r => r.key !== reaction.key));
    } else {
      setActiveReactions(prev => [...prev.slice(-2), reaction]);
    }
  };

  return (
    <div
      className={cn(
        'relative w-full max-w-[360px] mx-auto group cursor-pointer select-none',
        'transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      {/* Card template */}
      <img
        src={cardTemplate}
        alt="Wrigleyville 60613 Baseball Card"
        className="w-full h-auto block rounded-lg"
        draggable={false}
      />

      {/* Profile photo circle overlay */}
      <div
        className="absolute overflow-hidden rounded-full"
        style={{
          top: '26%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '50%',
          height: '36%',
        }}
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt={displayName}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              imgLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/60">
            <span className="text-4xl">⚾</span>
          </div>
        )}
      </div>

      {/* Display name */}
      <div
        className="absolute flex items-end justify-end"
        style={{
          bottom: '2%',
          left: '40%',
          right: '5%',
          height: '8%',
          zIndex: 10,
        }}
      >
        <span
          className="font-bold truncate px-2"
          style={{
            fontSize: 'clamp(10px, 3.2vw, 17px)',
            fontFamily: "'Graduate', 'Inter', serif",
            color: '#1a237e',
            maxWidth: '100%',
            letterSpacing: '0.5px',
            lineHeight: 1.2,
          }}
        >
          {displayName}
        </span>
      </div>

      {/* Active reaction overlays — bottom right of card */}
      <AnimatePresence>
        {activeReactions.length > 0 && (
          <div
            className="absolute flex gap-1 items-end"
            style={{ bottom: '12%', right: '6%', zIndex: 20 }}
          >
            {activeReactions.map((r) => (
              <motion.div
                key={r.key}
                initial={{ scale: 0, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <RealisticEmoji src={r.image} alt={r.label} size="md" />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: '0 0 20px rgba(204,52,51,0.3), 0 0 40px rgba(30,58,95,0.2)',
        }}
      />

      {/* Quick-react strip below card */}
      {showReactions && (
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1 px-1 scrollbar-hide">
          {REACTIONS.slice(0, 8).map((r) => (
            <motion.button
              key={r.key}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.12 }}
              onClick={(e) => {
                e.stopPropagation();
                handleReact(r);
              }}
              className={cn(
                'flex-shrink-0 p-1.5 rounded-full border transition-colors',
                activeReactions.find(a => a.key === r.key)
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 bg-muted/40 hover:bg-primary/5'
              )}
            >
              <RealisticEmoji src={r.image} alt={r.label} size="xs" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
