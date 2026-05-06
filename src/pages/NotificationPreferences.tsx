import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Beer, CalendarDays, Sparkles, Trophy } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNotificationPreferences, type NotificationCategory } from '@/hooks/useNotificationPreferences';

const ROWS: { key: NotificationCategory; label: string; description: string; icon: typeof Users }[] = [
  { key: 'buddies', label: 'Buddy requests',  description: 'When a fan says hi or a request is accepted.', icon: Users },
  { key: 'beers',   label: 'Beers received',  description: 'Tips and shoutouts from fellow fans.',         icon: Beer },
  { key: 'meetups', label: 'Meetup invites',  description: 'New meetups, joins, and nearby plans.',       icon: CalendarDays },
  { key: 'vibes',   label: 'Vibe mentions',   description: 'When someone tags or reacts to your vibe.',   icon: Sparkles },
  { key: 'gameday', label: 'Game day alerts', description: 'First pitch, crew activity, and post-game.',  icon: Trophy },
];

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const { preferences, isLoading, setPreference, isSaving } = useNotificationPreferences();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-lg px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="h-11 w-11 -ml-2 inline-flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">Notifications</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Choose what you want to hear about. Turning a category off stops new alerts of that type.
        </p>

        <ul className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {ROWS.map(({ key, label, description, icon: Icon }) => {
            const checked = preferences[key];
            return (
              <li key={key} className="flex items-center gap-3 p-4 min-h-[64px]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold leading-tight">{label}</p>
                  <p className="text-[13px] text-muted-foreground leading-snug mt-0.5">{description}</p>
                </div>
                <Switch
                  checked={checked}
                  disabled={isLoading || isSaving}
                  onCheckedChange={(v) => setPreference(key, v)}
                  aria-label={`Toggle ${label}`}
                />
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-muted-foreground mt-4 px-1">
          Settings sync instantly across your devices.
        </p>
      </main>
    </div>
  );
}
