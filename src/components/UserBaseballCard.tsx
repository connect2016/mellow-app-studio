import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import cardTemplate from '@/assets/baseball-card-template.png';
import { REACTIONS, ReactionDef } from '@/components/reactions/reactionData';
import { RealisticEmoji } from '@/components/reactions/RealisticEmoji';
import { GameStatus } from '@/types';

interface UserBaseballCardProps {
  profileImage?: string | null;
  displayName: string;
  className?: string;
  onClick?: () => void;
  badges?: string[];
  stats?: Record<string, number>;
  showReactions?: boolean;
  gameStatus?: GameStatus | string | null;
  wrigleySection?: string | null;
  wrigleyvilleBar?: string | null;
}

export function UserBaseballCard({
  profileImage,
  displayName,
  className,
  onClick,
  showReactions = true,
  gameStatus,
  wrigleySection,
  wrigleyvilleBar,
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
        'relative w-full mx-auto group cursor-pointer select-none',
        'transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
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
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              imgLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/60">
            <img
              src={cardTemplate}
              alt=""
              className="h-8 w-8 opacity-30 object-contain"
              draggable={false}
            />
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
      {activeReactions.length > 0 && (
        <div
          className="absolute flex gap-1 items-end"
          style={{ bottom: '12%', right: '6%', zIndex: 20 }}
        >
          {activeReactions.map((r) => (
            <div key={r.key} className="animate-scale-in">
              <RealisticEmoji src={r.image} alt={r.label} size="md" />
            </div>
          ))}
        </div>
      )}

      {/* Hover glow — Cubs red/blue */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: '0 0 20px hsla(0, 65%, 50%, 0.3), 0 0 40px hsla(215, 52%, 25%, 0.2)',
        }}
      />

      {/* Quick-react strip below card */}
      {showReactions && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 px-1 scrollbar-hide">
          {REACTIONS.slice(0, 8).map((r) => (
            <button
              key={r.key}
              onClick={(e) => {
                e.stopPropagation();
                handleReact(r);
              }}
              className={cn(
                'flex-shrink-0 p-2 rounded-full border min-h-[44px] min-w-[44px] flex items-center justify-center',
                'active:scale-90 transition-all duration-150',
                activeReactions.find(a => a.key === r.key)
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border/50 bg-muted/40 hover:bg-primary/5'
              )}
            >
              <RealisticEmoji src={r.image} alt={r.label} size="xs" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
