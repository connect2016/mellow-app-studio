import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { IntentChip } from '@/components/IntentChip';
import { StatusBadge } from '@/components/StatusBadge';
import { MOCK_USERS } from '@/types';
import { Button } from '@/components/ui/button';
import { Verified, MapPin, ArrowLeft, Flag, Ban, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If no id, show "my profile" (first mock user)
  const user = id ? MOCK_USERS.find((u) => u.id === id) : MOCK_USERS[0];
  const isOwnProfile = !id;

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex items-center justify-center pt-20">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      <div className="mx-auto max-w-lg">
        {/* Back button for other profiles */}
        {!isOwnProfile && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 px-4 pt-4 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        {/* Photo */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
          <img src={user.profile_photo} alt={user.display_name} className="h-80 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>

        <div className="px-4 -mt-16 relative">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              {user.display_name}, {user.age}
            </h1>
            {user.is_verified && <Verified className="h-6 w-6 text-primary" />}
          </div>
          {user.pronouns && <p className="text-sm text-muted-foreground">{user.pronouns}</p>}

          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={user.game_status} />
            {user.game_status === 'AtWrigley' && user.wrigley_location_privacy === 'Public' && user.wrigley_section && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> Section {user.wrigley_section}, Row {user.wrigley_row}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {user.intent.map((i) => <IntentChip key={i} intent={i} />)}
          </div>

          <p className="mt-4 text-sm leading-relaxed">{user.bio}</p>

          {/* Prompts */}
          <div className="mt-6 space-y-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Favorite Player</p>
              <p className="font-medium">⚾ {user.favorite_player}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Favorite Moment</p>
              <p className="font-medium">🎉 {user.favorite_moment}</p>
            </div>
            {user.superstition && (
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">My Cubs Superstition</p>
                <p className="font-medium">🧢 {user.superstition}</p>
              </div>
            )}
            {user.stretch_song && (
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">7th Inning Stretch Song</p>
                <p className="font-medium">🎵 {user.stretch_song}</p>
              </div>
            )}
            {user.best_bar && (
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Best Wrigleyville Bar</p>
                <p className="font-medium">🍻 {user.best_bar}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isOwnProfile ? (
            <div className="mt-6 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => toast({ title: '🖐️ Hi-Five sent!' })} variant="outline" className="rounded-xl">🖐️ Hi-Five</Button>
                <Button onClick={() => navigate('/messages')} variant="outline" className="rounded-xl"><MessageCircle className="mr-1 h-4 w-4" /> Chat</Button>
                <Button onClick={() => navigate(`/beer-money?to=${user.id}`)} variant="outline" className="rounded-xl">🍺 Beer</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-1" onClick={() => toast({ title: 'User reported' })}>
                  <Flag className="h-3 w-3" /> Report
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-1" onClick={() => toast({ title: 'User blocked' })}>
                  <Ban className="h-3 w-3" /> Block
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <Button className="w-full rounded-xl" onClick={() => toast({ title: 'Edit mode coming with backend!' })}>
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
