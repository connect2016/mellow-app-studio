import { Bell, Users, Beer, Heart, Trophy, Moon, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotifFrequency,
} from '@/hooks/useNotificationPreferences';

const FREQ_OPTIONS: { value: NotifFrequency; label: string; hint: string }[] = [
  { value: 'instant', label: 'Instant', hint: 'Right when it happens' },
  { value: 'hourly', label: 'Hourly digest', hint: 'Bundled every hour' },
  { value: 'daily', label: 'Daily digest', hint: 'One summary per day' },
  { value: 'off', label: 'Off', hint: "Don't notify me" },
];

const CATEGORIES = [
  {
    key: 'meetup_freq' as const,
    title: 'Meetup matches',
    description: 'New meetups at your favorite bars or matching your intent',
    Icon: Users,
  },
  {
    key: 'bar_freq' as const,
    title: 'Bar availability',
    description: 'Vibe shifts, wait times, and check-in spikes at saved spots',
    Icon: Beer,
  },
  {
    key: 'friend_freq' as const,
    title: 'Friend activity',
    description: 'Matches, hi-fives, and when buddies check in nearby',
    Icon: Heart,
  },
  {
    key: 'gameday_freq' as const,
    title: 'Game day',
    description: 'First pitch reminders, score swings, and weather alerts',
    Icon: Trophy,
  },
];

export function NotificationPreferencesPanel() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  if (isLoading || !prefs) {
    return (
      <div className="rounded-xl border bg-card p-6 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allOff =
    prefs.meetup_freq === 'off' &&
    prefs.bar_freq === 'off' &&
    prefs.friend_freq === 'off' &&
    prefs.gameday_freq === 'off';

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
        Choose what you want to hear about — and when.
      </p>

      {/* Categories */}
      <div className="space-y-3">
        {CATEGORIES.map(({ key, title, description, Icon }) => (
          <div
            key={key}
            className="flex items-start justify-between gap-3 rounded-lg border bg-background/50 p-3"
          >
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
            <Select
              value={prefs[key]}
              onValueChange={(v) => update.mutate({ [key]: v as NotifFrequency })}
            >
              <SelectTrigger className="h-9 w-[130px] shrink-0 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQ_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    <span className="font-medium">{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <Separator />

      {/* Quiet hours */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-2.5 min-w-0">
            <Moon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Quiet hours</p>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Silence everything during these hours
              </p>
            </div>
          </div>
          <Switch
            checked={prefs.quiet_hours_enabled}
            onCheckedChange={(v) => update.mutate({ quiet_hours_enabled: v })}
          />
        </div>

        {prefs.quiet_hours_enabled && (
          <div className="grid grid-cols-2 gap-3 pl-7">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">From</Label>
              <Input
                type="time"
                value={prefs.quiet_start}
                onChange={(e) => update.mutate({ quiet_start: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Until</Label>
              <Input
                type="time"
                value={prefs.quiet_end}
                onChange={(e) => update.mutate({ quiet_end: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
