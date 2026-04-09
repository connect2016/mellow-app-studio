import { useState } from 'react';
import { cn } from '@/lib/utils';
import cardTemplate from '@/assets/baseball-card-template.png';

interface UserBaseballCardProps {
  profileImage?: string | null;
  displayName: string;
  className?: string;
  onClick?: () => void;
  /** Future extensibility */
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
      {/* Wrapper that matches image aspect ratio exactly */}
      <div className="relative w-full" style={{ aspectRatio: '2.5 / 3.5' }}>
        {/* Card template background */}
        <img
          src={cardTemplate}
          alt="Wrigleyville 60613 Baseball Card"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-lg"
          draggable={false}
        />

        {/* Drop shadow for depth */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
          }}
        />

      {/* Profile photo circle overlay — positioned to match the template's circle */}
      <div
        className="absolute overflow-hidden rounded-full"
        style={{
          top: '28%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '52%',
          height: '37%',
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

      {/* Display name overlay — covers the template's "Profile name here" text */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          bottom: '7%',
          left: '40%',
          right: '6%',
          height: '5%',
          background: 'linear-gradient(90deg, #b91c1c 0%, #991b1b 100%)',
          borderRadius: '4px',
        }}
      >
        <span
          className="text-white font-bold truncate drop-shadow-lg px-2"
          style={{
            fontSize: 'clamp(11px, 3.5vw, 18px)',
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
    </div>
  );
}
