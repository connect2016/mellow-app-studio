import { Bell, Users, Beer, Sparkles, Trophy, CalendarDays } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNotificationPreferences, type NotificationCategory } from '@/hooks/useNotificationPreferences';

const CATEGORIES: { key: NotificationCategory; title: string; description: string; Icon: typeof Bell }[] = [
  { key: 'buddies', title: 'Buddy requests',  description: 'When a fan says hi or accepts your request',         Icon: Users },
  { key: 'beers',   title: 'Beers received',  description: 'Tips and shoutouts from fellow fans',                Icon: Beer },
  { key: 'meetups', title: 'Meetup invites',  description: 'New meetups, joins, and nearby plans',               Icon: CalendarDays },
  { key: 'vibes',   title: 'Vibe mentions',   description: 'When someone tags or reacts to your vibe',           Icon: Sparkles },
  { key: 'gameday', title: 'Game day alerts', description: 'First pitch, crew activity, and post-game wrap-ups', Icon: Trophy },
];

export function NotificationPreferencesPanel() {
  const { preferences, isLoading, setPreference } = useNotificationPreferences();

  const allOff = CATEGORIES.every(({ key }) => preferences[key] === false);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Bell className="h-4 w-4 text-primary" /> Notifications
        </div>
        {allOff && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            All muted
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground -mt-1">
        Choose what you want to hear about.
      </p>

      <div className="space-y-2">
        {CATEGORIES.map(({ key, title, description, Icon }) => (
          <div
            key={key}
            className="flex items-start justify-between gap-3 rounded-lg border bg-background/50 p-3"
          >
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-[11px] leading-snug text-muted-foreground">{description}</p>
              </div>
            </div>
            <Switch
              checked={preferences[key]}
              disabled={isLoading}
              onCheckedChange={(v) => setPreference(key, v)}
              aria-label={`Toggle ${title}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
