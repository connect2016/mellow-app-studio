import { useState } from 'react';
import { cn } from '@/lib/utils';
import cardTemplate from '@/assets/baseball-card-template.png';

interface UserBaseballCardProps {
  profileImage?: string | null;
  displayName: string;
  className?: string;
  onClick?: () => void;
  badges?: string[];
  stats?: Record<string, number>;
}

export function UserBaseballCard({
  profileImage,
  displayName,
  className,
  onClick,
}: UserBaseballCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      className={cn(
        'relative w-full max-w-[360px] mx-auto group cursor-pointer select-none',
        'transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      {/* Card template — renders naturally to define container size */}
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

      {/* Display name overlay */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          bottom: '15.2%',
          left: '38%',
          right: '5%',
          height: '6%',
          background: 'linear-gradient(90deg, #c62828 0%, #b71c1c 100%)',
          borderRadius: '6px',
          zIndex: 10,
        }}
      >
        <span
          className="text-white font-bold truncate drop-shadow-lg px-2"
          style={{
            fontSize: 'clamp(10px, 3vw, 16px)',
            fontFamily: "'Graduate', 'Inter', serif",
            textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
            maxWidth: '100%',
          }}
        >
          {displayName}
        </span>
      </div>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: '0 0 20px rgba(204,52,51,0.3), 0 0 40px rgba(30,58,95,0.2)',
        }}
      />
    </div>
  );
}
