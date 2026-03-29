import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Verified, MapPin, ShieldCheck, Clock } from 'lucide-react';
import { UserProfile, GAMEDAY_INTENT_LABELS, GAMEDAY_INTENT_EMOJI, GamedayIntentType, FanStyleType, FAN_STYLE_OPTIONS } from '@/types';
import { IntentChip } from './IntentChip';
import { StatusBadge } from './StatusBadge';

interface ProfileCardProps {
  user: UserProfile;
  currentUserFanStyles?: FanStyleType[];
  onHiFive?: (message?: string) => void;
  onSendDog?: () => void;
  onLike?: () => void;
  onSendBeer?: () => void;
  onViewProfile?: () => void;
  onPass?: () => void;
  matchReasons?: string[];
  matchScore?: number;
}

interface PromptItem {
  label: string;
  value: string;
  emoji: string;
}

const ICEBREAKERS = [
  { emoji: '🏟️', text: 'First Cubs game?' },
  { emoji: '🎉', text: 'Best Wrigley memory?' },
  { emoji: '⚾', text: 'Who\'s your all-time favorite Cub?' },
  { emoji: '🍺', text: 'What\'s your go-to Wrigleyville bar?' },
  { emoji: '🐻', text: 'Were you there for the 2016 World Series?' },
  { emoji: '🎵', text: 'What\'s your 7th-inning stretch song?' },
  { emoji: '🌭', text: 'Hot dog or Chicago dog at Wrigley?' },
  { emoji: '🧢', text: 'What\'s your Cubs superstition?' },
];

function getPrompts(user: UserProfile): PromptItem[] {
  const prompts: PromptItem[] = [];
  if (user.superstition) prompts.push({ label: 'My Cubs superstition', value: user.superstition, emoji: '🧢' });
  if (user.best_bar) prompts.push({ label: 'Favorite Wrigleyville bar', value: user.best_bar, emoji: '🍻' });
  if (user.stretch_song) prompts.push({ label: '7th-inning stretch song', value: user.stretch_song, emoji: '🎵' });
  if (user.favorite_player) prompts.push({ label: 'Favorite player ever', value: user.favorite_player, emoji: '⚾' });
  if (user.favorite_moment) prompts.push({ label: 'Favorite Cubs moment', value: user.favorite_moment, emoji: '🎉' });
  return prompts;
}

function getActivityLabel(user: UserProfile): { text: string; pulse: boolean } | null {
  if (user.game_status === 'AtWrigley') return { text: 'In my seat right now', pulse: true };
  if (user.game_status === 'AtBar' && user.wrigleyville_bar) return { text: `At ${user.wrigleyville_bar}`, pulse: true };
  if (user.game_status === 'AtBar') return { text: 'At the bar', pulse: true };
  if (user.game_status === 'Tailgating') return { text: 'Tailgating now 🌭', pulse: true };
  if (user.game_status === 'BeerSnake') return { text: 'Beer Snake in the bleachers 🐍', pulse: true };
  if (user.game_status === 'WatchingRemote') return { text: 'Watching from home', pulse: true };
  const lastActive = user.last_active ? new Date(user.last_active) : null;
  if (!lastActive) return null;
  const mins = Math.floor((Date.now() - lastActive.getTime()) / 60000);
  if (mins < 1) return { text: 'Active just now', pulse: false };
  if (mins < 60) return { text: `Active ${mins}m ago`, pulse: false };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { text: `Active ${hrs}h ago`, pulse: false };
  return null;
}

export function ProfileCard({ user, currentUserFanStyles, onHiFive, onSendDog, onLike, onSendBeer, onViewProfile, onPass, matchReasons, matchScore }: ProfileCardProps) {
  const [hiFiveAnim, setHiFiveAnim] = useState(false);
  const [dogAnim, setDogAnim] = useState(false);
  const [flyingEmoji, setFlyingEmoji] = useState(false);
  const [flyingDog, setFlyingDog] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const activity = getActivityLabel(user);
  const prompts = getPrompts(user).slice(0, 2);

  // Pick 4 random icebreakers, personalized if possible
  const personalizedIcebreakers = (() => {
    const picks = [...ICEBREAKERS];
    // Add contextual ones based on user profile
    if (user.game_status === 'AtWrigley') {
      picks.unshift({ emoji: '📍', text: `How's the view from Section ${user.wrigley_section || 'yours'}?` });
    }
    if (user.game_status === 'AtBar' && user.wrigleyville_bar) {
      picks.unshift({ emoji: '🍻', text: `How's ${user.wrigleyville_bar} right now?` });
    }
    if (user.favorite_player) {
      picks.unshift({ emoji: '⭐', text: `${user.favorite_player} fan too? What's your best memory of them?` });
    }
    // Return first 4 unique
    return picks.slice(0, 4);
  })();

  const handleHiFive = () => {
    setShowIcebreakers(true);
  };

  const sendHiFiveWithMessage = (message?: string) => {
    setShowIcebreakers(false);
    setHiFiveAnim(true);
    setFlyingEmoji(true);
    setTimeout(() => setHiFiveAnim(false), 500);
    setTimeout(() => setFlyingEmoji(false), 1000);
    onHiFive?.(message);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_24px_-4px_hsl(var(--foreground)/0.08)]"
    >
      {/* Flying hi-five */}
      <AnimatePresence>
        {flyingEmoji && (
          <motion.div
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ opacity: 0, scale: 2.5, y: -200 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute bottom-20 left-1/4 z-30 text-4xl pointer-events-none"
          >
            🖐️
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying hot dog */}
      <AnimatePresence>
        {flyingDog && (
          <motion.div
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ opacity: 0, scale: 2.5, y: -200 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute bottom-20 right-1/4 z-30 text-4xl pointer-events-none"
          >
            🌭
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo */}
      <div className="relative aspect-[3/4] cursor-pointer" onClick={onViewProfile}>
        {/* Glowing status ring */}
        {user.game_status && user.game_status !== 'NotSet' && (
          <div className={`absolute inset-0 z-[1] rounded-t-2xl pointer-events-none ${
            user.game_status === 'AtWrigley' ? 'ring-2 ring-inset ring-primary shadow-[inset_0_0_20px_hsl(var(--primary)/0.25)]'
            : user.game_status === 'AtBar' ? 'ring-2 ring-inset ring-accent shadow-[inset_0_0_20px_hsl(var(--accent)/0.25)]'
            : user.game_status === 'Tailgating' ? 'ring-2 ring-inset ring-secondary shadow-[inset_0_0_20px_hsl(var(--secondary)/0.25)]'
            : user.game_status === 'BeerSnake' ? 'ring-2 ring-inset ring-[hsl(120,60%,40%)] shadow-[inset_0_0_20px_hsl(120,60%,40%,0.25)]'
            : 'ring-2 ring-inset ring-muted-foreground/40'
          }`} />
        )}
        <img src={user.profile_photo} alt={user.display_name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Activity badge */}
        {activity && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-1 border border-white/10">
              {activity.pulse ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              ) : (
                <Clock className="h-3 w-3 text-white/60" />
              )}
              <span className="text-[11px] font-medium text-white/90">{activity.text}</span>
            </div>
          </div>
        )}

        {/* Trust badges - top right */}
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          {user.is_verified && (
            <div className="flex items-center gap-1 rounded-full bg-primary/80 backdrop-blur-md px-2 py-0.5">
              <ShieldCheck className="h-3 w-3 text-primary-foreground" />
              <span className="text-[10px] font-semibold text-primary-foreground">Verified</span>
            </div>
          )}
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              {user.display_name}, {user.age}
            </h3>
          </div>
          {user.pronouns && <p className="text-xs text-white/70 mb-1">{user.pronouns}</p>}
          <p className="line-clamp-2 text-sm text-white/85 leading-relaxed">{user.bio}</p>

          <div className="mt-2.5 flex items-center gap-2">
            <StatusBadge status={user.game_status} />
            {user.game_status === 'AtWrigley' && user.wrigley_location_privacy === 'Public' && user.wrigley_section && (
              <span className="flex items-center gap-1 text-xs text-white/60">
                <MapPin className="h-3 w-3" /> Sec {user.wrigley_section}
              </span>
            )}
            {user.game_status === 'AtBar' && user.bar_location_privacy === 'Public' && user.wrigleyville_bar && (
              <span className="flex items-center gap-1 text-xs text-white/60">
                <MapPin className="h-3 w-3" /> {user.wrigleyville_bar}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {user.intent.map((i) => <IntentChip key={i} intent={i} />)}
          </div>

          {/* Gameday Intent Badges */}
          {user.gameday_intents && user.gameday_intents.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {user.gameday_intents.map((gi) => (
                <span
                  key={gi}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary/20 border border-secondary/30 px-2 py-0.5 text-[10px] font-semibold text-white/90"
                >
                  <span>{GAMEDAY_INTENT_EMOJI[gi]}</span>
                  <span>{GAMEDAY_INTENT_LABELS[gi]}</span>
                </span>
              ))}
            </div>
          )}

          {/* Fan Style chips with Common Ground */}
          {user.fan_style && user.fan_style.length > 0 && (() => {
            const myStyles = currentUserFanStyles ?? [];
            const commonStyles = user.fan_style!.filter((s) => myStyles.includes(s as FanStyleType));
            const hasCommon = commonStyles.length > 0;
            return (
              <div className="mt-2">
                {hasCommon && (
                  <p className="text-[10px] font-bold text-accent mb-1">⚡ Common Ground!</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {user.fan_style!.map((s) => {
                    const opt = FAN_STYLE_OPTIONS.find((o) => o.value === s);
                    if (!opt) return null;
                    const isCommon = myStyles.includes(s as FanStyleType);
                    return (
                      <span
                        key={s}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          isCommon
                            ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                            : 'bg-white/10 text-white/80 border-white/20'
                        }`}
                      >
                        <span>{opt.emoji}</span>
                        <span>{opt.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Why you match */}
      {matchReasons && matchReasons.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Why you match</span>
            {matchScore != null && matchScore > 0 && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                matchScore >= 60 ? 'bg-primary/15 text-primary' :
                matchScore >= 35 ? 'bg-accent/15 text-accent' :
                'bg-muted text-muted-foreground'
              }`}>
                {matchScore}% match
              </span>
            )}
          </div>
          <div className="space-y-1">
            {matchReasons.map((reason, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="text-sm text-foreground/80 leading-snug"
              >
                {reason}
              </motion.p>
            ))}
          </div>
        </div>
      )}

      {/* Profile prompts */}
      {prompts.length > 0 && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {prompts.map((p) => (
            <div key={p.label} className="rounded-xl bg-muted/50 px-3 py-2.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{p.emoji} {p.label}</p>
              <p className="text-sm font-medium text-foreground leading-snug">{p.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Icebreaker picker */}
      <AnimatePresence>
        {showIcebreakers && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-4 py-3 bg-primary/[0.03]">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                🖐️ Send a Hi-Five with an icebreaker
              </p>
              <div className="space-y-1.5">
                {personalizedIcebreakers.map((ib, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => sendHiFiveWithMessage(ib.text)}
                    className="w-full flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
                  >
                    <span className="text-base shrink-0">{ib.emoji}</span>
                    <span className="text-sm font-medium text-foreground">{ib.text}</span>
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => sendHiFiveWithMessage()}
                  className="flex-1 text-center text-xs font-medium text-muted-foreground py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  Just Hi-Five 🖐️
                </button>
                <button
                  onClick={() => setShowIcebreakers(false)}
                  className="text-xs font-medium text-muted-foreground py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center justify-around border-t border-border px-2 py-2.5">
        <motion.button
          onClick={handleHiFive}
          animate={hiFiveAnim ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
        >
          <span className="text-xl">🖐️</span>
          <span className="font-medium">Hi-Five</span>
        </motion.button>
        <button
          onClick={onLike}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/5"
        >
          <span className="text-xl">❤️</span>
          <span className="font-medium">Like</span>
        </button>
        <button
          onClick={onSendBeer}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
        >
          <span className="text-xl">🍺</span>
          <span className="font-medium">Beer</span>
        </button>
        {onPass && (
          <button
            onClick={onPass}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
          >
            <span className="text-xl">👋</span>
            <span className="font-medium">Pass</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
