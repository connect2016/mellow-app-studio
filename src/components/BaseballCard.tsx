import { useState } from 'react';
import { cn } from '@/lib/utils';
import { IntentType, INTENT_LABELS, INTENT_EMOJI, GameStatus, GAME_STATUS_LABELS, GAME_STATUS_EMOJI } from '@/types';
import { ShieldCheck } from 'lucide-react';
import { GamedayPersona, PERSONA_CONFIG } from '@/components/PersonaBadge';
import { PersonaIcon } from '@/components/icons/PersonaIcons';
import logoTransparent from '@/assets/logo-transparent.png';
import cardFrontArt from '@/assets/baseball-card-front.png';

// "Position" labels based on fan style / persona
const POSITION_LABELS: Record<string, string> = {
  die_hard: 'STAT GEEK',
  social_butterfly: 'BEER SNAKE LEADER',
  tourist: 'ROOKIE FAN',
};

interface BaseballCardProps {
  displayName: string;
  age?: number | null;
  profilePhoto?: string | null;
  isVerified?: boolean | null;
  gameStatus?: GameStatus;
  wrigleySection?: string | null;
  wrigleyRow?: string | null;
  wrigleyvilleBar?: string | null;
  intent?: IntentType[];
  persona?: string | null;
  bio?: string | null;
  favoritePlayer?: string | null;
  favoriteMoment?: string | null;
  superstition?: string | null;
  stretchSong?: string | null;
  bestBar?: string | null;
  pronouns?: string | null;
  // Stats
  gamesAttended?: number;
  buddiesMet?: number;
  totalInnings?: number;
  className?: string;
  interactive?: boolean;
}

export function BaseballCard({
  displayName,
  age,
  profilePhoto,
  isVerified,
  gameStatus,
  wrigleySection,
  wrigleyRow,
  wrigleyvilleBar,
  intent = [],
  persona,
  bio,
  favoritePlayer,
  favoriteMoment,
  superstition,
  stretchSong,
  bestBar,
  pronouns,
  gamesAttended = 0,
  buddiesMet = 0,
  totalInnings = 0,
  className,
  interactive = true,
}: BaseballCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const position = persona && POSITION_LABELS[persona]
    ? POSITION_LABELS[persona]
    : 'BLEACHER BUM';

  const location = wrigleyvilleBar
    || (wrigleySection ? `Section ${wrigleySection}` : null)
    || 'WRIGLEYVILLE';

  const primaryIntent = intent[0];

  const handleFlip = () => {
    if (interactive) setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={cn('baseball-card-perspective cursor-pointer', className)}
      onClick={handleFlip}
      style={{ perspective: '1200px' }}
    >
      <div
        className="baseball-card-inner relative w-full transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          aspectRatio: '2.5 / 3.5',
        }}
      >
        {/* ===== FRONT ===== */}
        <div
          className="baseball-card-face absolute inset-0"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div
            className="relative h-full w-full rounded-lg overflow-hidden shadow-xl"
            style={{
              backgroundImage: `url(${cardFrontArt})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {/* Subtle gradient for text contrast on pennant area */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, transparent 0%, transparent 60%, rgba(0,0,0,0.05) 100%)',
              }}
              aria-hidden="true"
            />

            {/* Centered avatar (top two-thirds) */}
            <div className="absolute inset-x-0 top-0 h-2/3 flex items-center justify-center px-[12%]">
              <Avatar88 src={profilePhoto} name={displayName} verified={!!isVerified} />
            </div>

            {/* Username in lower-right pennant area */}
            <div
              className="absolute"
              style={{
                left: '14%',
                right: '8%',
                bottom: '11%',
                paddingLeft: '12px',
                paddingRight: '12px',
              }}
            >
              <p
                className="font-semibold text-[16px] leading-tight truncate text-right"
                style={{
                  color: '#0A2A66',
                  fontFamily: "'Graduate', 'Barlow Condensed', serif",
                  textShadow: '0 1px 0 rgba(255,255,255,0.6)',
                }}
                title={displayName}
              >
                {displayName}{age ? `, ${age}` : ''}
              </p>
              {(gameStatus && gameStatus !== 'NotSet') || primaryIntent ? (
                <div className="flex items-center justify-end gap-2 mt-0.5">
                  {gameStatus && gameStatus !== 'NotSet' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#0A2A66' }}>
                      {GAME_STATUS_EMOJI[gameStatus]} {GAME_STATUS_LABELS[gameStatus]}
                    </span>
                  )}
                  {primaryIntent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#CC3433' }}>
                      {INTENT_EMOJI[primaryIntent]} {INTENT_LABELS[primaryIntent]}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {interactive && (
            <p className="text-center text-[9px] text-muted-foreground mt-1.5 font-scoreboard uppercase tracking-widest">
              Tap to flip card
            </p>
          )}
        </div>

        {/* ===== BACK ===== */}
        <div
          className="baseball-card-face absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div
            className="relative h-full rounded-lg overflow-hidden border-[6px] border-[#C4A661] shadow-xl flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #F5E6C8 0%, #EAD8A0 50%, #DCC886 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {/* Logo on back */}
            <div className="absolute top-2 right-2 z-20">
              <img
                src={logoTransparent}
                alt="Cubbies Buddies"
                className="h-6 w-auto opacity-70"
              />
            </div>

            {/* Header */}
            <div className="px-3 pt-3 pb-1.5">
              <h3
                className="text-sm font-black uppercase tracking-wide"
                style={{
                  fontFamily: "'Graduate', serif",
                  color: '#1E3A5F',
                  borderBottom: '2px solid #C4A661',
                  paddingBottom: '4px',
                }}
              >
                {displayName}
              </h3>
              {pronouns && (
                <span className="text-[9px] font-scoreboard" style={{ color: '#6B5B3E' }}>{pronouns}</span>
              )}
            </div>

            {/* Stats box */}
            <div className="mx-3 mb-2 rounded-md p-2" style={{ background: 'rgba(30,58,95,0.06)', border: '1px solid #C4A661' }}>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <StatBox label="G" sublabel="GAMES" value={gamesAttended} />
                <StatBox label="BM" sublabel="BUDDIES" value={buddiesMet} />
                <StatBox label="TI" sublabel="INNINGS" value={totalInnings} />
              </div>
            </div>

            {/* Detail sections */}
            <div className="px-3 space-y-1.5 pb-3 flex-1 overflow-y-auto">
              {favoritePlayer && (
                <DetailRow label="FAVORITE ALL-TIME CUB" value={favoritePlayer} emoji="" />
              )}
              {bestBar && (
                <DetailRow label="HOME BAR" value={bestBar} emoji="" />
              )}
              {superstition && (
                <DetailRow label="GAME DAY SUPERSTITION" value={superstition} emoji="" />
              )}
              {stretchSong && (
                <DetailRow label="7TH INNING STRETCH SONG" value={stretchSong} emoji="" />
              )}
              {favoriteMoment && (
                <DetailRow label="BEST BALLPARK STORY" value={favoriteMoment} emoji="" />
              )}
              {bio && (
                <DetailRow label="SCOUTING REPORT" value={bio} emoji="" />
              )}

              {intent.length > 0 && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#6B5B3E' }}>
                    LOOKING FOR
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {intent.map((i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                        style={{
                          background: '#1E3A5F',
                          color: '#F5E6C8',
                          border: '1px solid #C4A661',
                        }}
                      >
                        {INTENT_EMOJI[i]} {INTENT_LABELS[i]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {persona && persona in PERSONA_CONFIG && (
                <div className="flex items-center gap-1.5 mt-0.5" style={{ color: '#CC3433' }}>
                  <PersonaIcon name={persona} size={12} strokeWidth={2} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    {PERSONA_CONFIG[persona as GamedayPersona].label}
                  </span>
                </div>
              )}
            </div>

            {/* Footer stripe */}
            <div
              className="h-1.5"
              style={{
                background: 'linear-gradient(90deg, #CC3433 0%, #1E3A5F 33%, #2D7D46 66%, #C4A661 100%)',
              }}
            />
          </div>

          {interactive && (
            <p className="text-center text-[9px] text-muted-foreground mt-1.5 font-scoreboard uppercase tracking-widest">
              Tap to flip back
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar88({ src, name, verified }: { src?: string | null; name: string; verified: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const initials = (name || 'Fan')
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const showImage = !!src && !errored;
  return (
    <div
      role="img"
      aria-label={`Profile photo of ${name || 'Fan'}`}
      tabIndex={0}
      className="relative rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CC3433]"
      style={{
        width: 88,
        height: 88,
        boxShadow: '0 0 0 4px #FFFFFF, 0 6px 18px rgba(0,0,0,0.35)',
        background: '#0A2A66',
      }}
    >
      {!loaded && showImage && (
        <div className="absolute inset-0 animate-pulse" style={{ background: '#cbd5e1' }} aria-hidden="true" />
      )}
      {showImage ? (
        <img
          src={src!}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn('w-full h-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl"
          style={{ fontFamily: "'Graduate', serif" }}
        >
          {initials || 'CB'}
        </div>
      )}
      {verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center rounded-full"
          style={{ background: '#FFFFFF', padding: 2 }}
          aria-label="Verified fan"
        >
          <ShieldCheck className="h-4 w-4" style={{ color: '#0A2A66' }} />
        </span>
      )}
    </div>
  );
}


function StatBox({ label, sublabel, value }: { label: string; sublabel: string; value: number }) {
  return (
    <div>
      <p
        className="text-2xl font-black"
        style={{ fontFamily: "'Graduate', serif", color: '#1E3A5F' }}
      >
        {value}
      </p>
      <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#6B5B3E' }}>
        {label}
      </p>
      <p className="text-[7px] uppercase tracking-wider" style={{ color: '#8B7B5E' }}>
        {sublabel}
      </p>
    </div>
  );
}

function DetailRow({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div
      className="rounded-md px-3 py-2"
      style={{
        background: 'rgba(30,58,95,0.04)',
        borderLeft: '3px solid #CC3433',
      }}
    >
      <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#6B5B3E' }}>
        {emoji} {label}
      </p>
      <p
        className="text-xs font-medium"
        style={{ fontFamily: "'Share Tech Mono', monospace", color: '#1E3A5F' }}
      >
        {value}
      </p>
    </div>
  );
}
