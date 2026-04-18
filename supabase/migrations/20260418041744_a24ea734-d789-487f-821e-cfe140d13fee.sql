-- Notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  -- Per-category frequency: 'instant' | 'hourly' | 'daily' | 'off'
  meetup_freq text NOT NULL DEFAULT 'instant',
  bar_freq text NOT NULL DEFAULT 'instant',
  friend_freq text NOT NULL DEFAULT 'instant',
  gameday_freq text NOT NULL DEFAULT 'instant',
  -- Quiet hours (local time, HH:MM 24h). NULL means disabled.
  quiet_hours_enabled boolean NOT NULL DEFAULT false,
  quiet_start time DEFAULT '22:00',
  quiet_end time DEFAULT '08:00',
  timezone text NOT NULL DEFAULT 'America/Chicago',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER notif_prefs_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: classify a notification.type into a preference category
CREATE OR REPLACE FUNCTION public.notification_category(_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _type IN ('meetup_new', 'meetup_invite', 'meetup_join', 'meetup_reminder') THEN 'meetup'
    WHEN _type IN ('bar_busy', 'bar_quiet', 'bar_vote', 'bar_checkin') THEN 'bar'
    WHEN _type IN ('match', 'hi_five', 'message', 'friend_checkin', 'friend_meetup') THEN 'friend'
    WHEN _type IN ('game_start', 'game_score', 'game_weather', 'game_reminder') THEN 'gameday'
    ELSE 'other'
  END;
$$;

-- Filter trigger: respects user prefs (frequency=off + quiet hours)
CREATE OR REPLACE FUNCTION public.respect_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefs record;
  category text;
  freq text;
  local_now time;
  in_quiet boolean;
BEGIN
  category := public.notification_category(NEW.type);

  -- 'other' category bypasses prefs (system notifs always go through)
  IF category = 'other' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO prefs FROM public.notification_preferences WHERE user_id = NEW.user_id;

  -- No prefs row => defaults (instant for everything, no quiet hours) => allow
  IF prefs IS NULL THEN
    RETURN NEW;
  END IF;

  freq := CASE category
    WHEN 'meetup' THEN prefs.meetup_freq
    WHEN 'bar' THEN prefs.bar_freq
    WHEN 'friend' THEN prefs.friend_freq
    WHEN 'gameday' THEN prefs.gameday_freq
  END;

  -- Off => drop silently
  IF freq = 'off' THEN
    RETURN NULL;
  END IF;

  -- Quiet hours check (handles overnight windows like 22:00 -> 08:00)
  IF prefs.quiet_hours_enabled AND prefs.quiet_start IS NOT NULL AND prefs.quiet_end IS NOT NULL THEN
    local_now := (now() AT TIME ZONE COALESCE(prefs.timezone, 'America/Chicago'))::time;
    IF prefs.quiet_start <= prefs.quiet_end THEN
      in_quiet := local_now >= prefs.quiet_start AND local_now < prefs.quiet_end;
    ELSE
      in_quiet := local_now >= prefs.quiet_start OR local_now < prefs.quiet_end;
    END IF;

    IF in_quiet THEN
      RETURN NULL;
    END IF;
  END IF;

  -- Digests (hourly/daily) are accepted now — a future cron job can batch them.
  -- For instant we just allow.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_respect_preferences ON public.notifications;
CREATE TRIGGER notifications_respect_preferences
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.respect_notification_preferences();