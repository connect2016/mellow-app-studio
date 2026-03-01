import { motion } from 'framer-motion';
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
}

export function ProfileCard({ user, onHiFive, onLike, onSendBeer, onViewProfile }: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border bg-card shadow-lg"
    >
      {/* Photo */}
      <div className="relative aspect-[3/4] cursor-pointer" onClick={onViewProfile}>
        <img
          src={user.profile_photo}
          alt={user.display_name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

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
      <div className="flex items-center justify-around border-t p-3">
        <button
          onClick={onHiFive}
          className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-secondary transition-colors"
        >
          <span className="text-xl">🖐️</span>
          Hi-Five
        </button>
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
      </div>
    </motion.div>
  );
}
