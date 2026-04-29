import { useState } from 'react';
import { cn } from '@/lib/utils';
import { IntentType, INTENT_LABELS, INTENT_EMOJI, GameStatus, GAME_STATUS_LABELS, GAME_STATUS_EMOJI } from '@/types';
import { ShieldCheck, MapPin } from 'lucide-react';
import { GamedayPersona, PERSONA_CONFIG } from '@/components/PersonaBadge';
import logoTransparent from '@/assets/logo-transparent.png';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

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
          <div className="relative h-full rounded-lg overflow-hidden border-[6px] border-[#C4A661] shadow-xl flex flex-col"
            style={{
              background: 'linear-gradient(135deg, #1E3A5F 0%, #14284B 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {/* Logo overlay */}
            <div className="absolute top-2 left-2 z-20">
              <img
                src={logoTransparent}
                alt="Cubbies Buddies"
                className="h-8 w-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
              />
            </div>

            {/* Photo area */}
            <div className="flex-1 flex items-center justify-center px-4 pt-12 pb-2">
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-[#C4A661] shadow-lg"
                style={{
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.1)',
                }}
              >
                <img
                  src={profilePhoto || '/placeholder.svg'}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  style={{ filter: 'sepia(15%) contrast(1.05) saturate(0.9)' }}
                />
                <div className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.3) 100%)',
                  }}
                />
              </div>
            </div>

            {/* Name plate */}
            <div className="px-3 pb-1.5 text-center">
              <div
                className="mx-auto rounded-md py-1.5 px-3"
                style={{
                  background: 'linear-gradient(180deg, #F5E6C8 0%, #E8D5A8 100%)',
                  border: '2px solid #C4A661',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                <h2
                  className="text-base font-black uppercase tracking-wide"
                  style={{
                    fontFamily: "'Graduate', 'Barlow Condensed', serif",
                    color: '#1E3A5F',
                    textShadow: '1px 1px 0 rgba(255,255,255,0.3)',
                  }}
                >
                  {displayName}{age ? `, ${age}` : ''}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-0.5">
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: '#CC3433', fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {position}
                  </span>
                  {isVerified && (
                    <span className="inline-flex items-center gap-0.5">
                      <ShieldCheck className="h-3 w-3" style={{ color: '#2D7D46' }} />
                      <span className="text-[8px] font-bold" style={{ color: '#2D7D46' }}>VERIFIED</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Location bar */}
            <div
              className="mx-3 mb-1.5 rounded-md px-2 py-1 flex items-center justify-center gap-1.5"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(196,166,97,0.3)',
              }}
            >
              <MapPin className="h-3 w-3" style={{ color: '#C4A661' }} />
              <span
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: '#F5E6C8' }}
              >
                {location}
              </span>
            </div>

            {/* Status + Intent row */}
            <div className="px-3 pb-2 flex items-center justify-between">
              {gameStatus && gameStatus !== 'NotSet' && (
                <span
                  className="text-[9px] font-semibold uppercase tracking-wide"
                  style={{ color: '#8CC63F' }}
                >
                  {GAME_STATUS_EMOJI[gameStatus]} {GAME_STATUS_LABELS[gameStatus]}
                </span>
              )}
              <div className="flex-1" />
              {primaryIntent && (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center border-2"
                  style={{
                    background: 'linear-gradient(135deg, #CC3433, #A02020)',
                    borderColor: '#C4A661',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                  title={INTENT_LABELS[primaryIntent]}
                >
                  <span className="text-sm">{INTENT_EMOJI[primaryIntent]}</span>
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs"><ConceptIcon name={PERSONA_CONFIG[persona as GamedayPersona].emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#CC3433' }}>
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
