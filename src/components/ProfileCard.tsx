import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Verified, MapPin } from 'lucide-react';
import { UserProfile } from '@/types';
import { IntentChip } from './IntentChip';
import { StatusBadge } from './StatusBadge';

interface ProfileCardProps {
  user: UserProfile;
  onHiFive?: () => void;
  onLike?: () => void;
  onSendBeer?: () => void;
  onViewProfile?: () => void;
  onPass?: () => void;
}

function getActivityLabel(user: UserProfile): { text: string; pulse: boolean } | null {
  if (user.game_status === 'AtWrigley') return { text: '🏟️ At Wrigley right now', pulse: true };
  if (user.game_status === 'AtBar' && user.wrigleyville_bar) return { text: `🍻 At ${user.wrigleyville_bar}`, pulse: true };
  if (user.game_status === 'WatchingRemote') return { text: '📺 Watching now', pulse: true };

  const lastActive = user.last_active ? new Date(user.last_active) : null;
  if (!lastActive) return null;
  const mins = Math.floor((Date.now() - lastActive.getTime()) / 60000);
  if (mins < 1) return { text: 'Active just now', pulse: false };
  if (mins < 60) return { text: `Active ${mins}m ago`, pulse: false };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { text: `Active ${hrs}h ago`, pulse: false };
  return null;
}

export function ProfileCard({ user, onHiFive, onLike, onSendBeer, onViewProfile, onPass }: ProfileCardProps) {
  const [hiFiveAnim, setHiFiveAnim] = useState(false);
  const [flyingEmoji, setFlyingEmoji] = useState(false);
  const activity = getActivityLabel(user);

  const handleHiFive = () => {
    setHiFiveAnim(true);
    setFlyingEmoji(true);
    setTimeout(() => setHiFiveAnim(false), 500);
    setTimeout(() => setFlyingEmoji(false), 1000);
    onHiFive?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
    >
      {/* Flying hi-five animation */}
      <AnimatePresence>
        {flyingEmoji && (
          <motion.div
            initial={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            animate={{ opacity: 0, scale: 2.5, y: -200, x: 30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute bottom-16 left-1/4 z-30 text-4xl pointer-events-none"
          >
            🖐️
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo */}
      <div className="relative aspect-[3/4] cursor-pointer" onClick={onViewProfile}>
        <img
          src={user.profile_photo}
          alt={user.display_name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Activity indicator badge */}
        {activity && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1">
              {activity.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
              <span className="text-[11px] font-medium text-white">{activity.text}</span>
            </div>
          </div>
        )}

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              {user.display_name}, {user.age}
            </h3>
            {user.is_verified && <Verified className="h-5 w-5 text-primary" />}
          </div>
          {user.pronouns && (
            <p className="text-sm opacity-80">{user.pronouns}</p>
          )}
          <p className="mt-1 line-clamp-2 text-sm opacity-90">{user.bio}</p>

          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={user.game_status} />
            {user.game_status === 'AtWrigley' && user.wrigley_location_privacy === 'Public' && user.wrigley_section && (
              <span className="flex items-center gap-1 text-xs opacity-70">
                <MapPin className="h-3 w-3" /> Sec {user.wrigley_section}
              </span>
            )}
            {user.game_status === 'AtBar' && user.bar_location_privacy === 'Public' && user.wrigleyville_bar && (
              <span className="flex items-center gap-1 text-xs opacity-70">
                <MapPin className="h-3 w-3" /> {user.wrigleyville_bar}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {user.intent.map((i) => (
              <IntentChip key={i} intent={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-around border-t border-border p-3">
        <motion.button
          onClick={handleHiFive}
          animate={hiFiveAnim ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-secondary transition-colors"
        >
          <span className="text-xl">🖐️</span>
          Hi-Five
        </motion.button>
        <button
          onClick={onLike}
          className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <span className="text-xl">❤️</span>
          Like
        </button>
        <button
          onClick={onSendBeer}
          className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-secondary transition-colors"
        >
          <span className="text-xl">🍺</span>
          Send Beer
        </button>
        {onPass && (
          <button
            onClick={onPass}
            className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-xl">👋</span>
            Pass
          </button>
        )}
      </div>
    </motion.div>
  );
}
