
-- ============ FEATURE 5: activity_feed ============
CREATE TABLE public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('checked_in','hosted_meetup','joined_meetup','attended_game')),
  location_zone text,
  context_text text,
  w_flag_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_feed_created_at_idx ON public.activity_feed (created_at DESC);
CREATE INDEX activity_feed_user_id_idx ON public.activity_feed (user_id);
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity feed readable by authenticated"
  ON public.activity_feed FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own activity"
  ON public.activity_feed FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.react_w_flag(p_activity_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.activity_feed
     SET w_flag_count = w_flag_count + 1
   WHERE id = p_activity_id
  RETURNING w_flag_count INTO v_count;
  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_activity_meetup_hosted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_feed (user_id, activity_type, location_zone, context_text)
  VALUES (NEW.creator_id, 'hosted_meetup', NEW.location_name, NEW.location_name);
  RETURN NEW;
END; $$;
CREATE TRIGGER activity_meetup_hosted
AFTER INSERT ON public.lineup_meetups
FOR EACH ROW EXECUTE FUNCTION public.trg_activity_meetup_hosted();

CREATE OR REPLACE FUNCTION public.trg_activity_meetup_joined()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_venue text;
BEGIN
  SELECT location_name INTO v_venue FROM public.lineup_meetups WHERE id = NEW.meetup_id;
  INSERT INTO public.activity_feed (user_id, activity_type, location_zone, context_text)
  VALUES (NEW.user_id, 'joined_meetup', v_venue, v_venue);
  RETURN NEW;
END; $$;
CREATE TRIGGER activity_meetup_joined
AFTER INSERT ON public.lineup_members
FOR EACH ROW EXECUTE FUNCTION public.trg_activity_meetup_joined();

CREATE OR REPLACE FUNCTION public.trg_activity_bar_checkin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_feed (user_id, activity_type, location_zone, context_text)
  VALUES (NEW.user_id, 'checked_in', NEW.bar_name, NEW.bar_name);
  RETURN NEW;
END; $$;
CREATE TRIGGER activity_bar_checkin
AFTER INSERT ON public.bar_checkins
FOR EACH ROW EXECUTE FUNCTION public.trg_activity_bar_checkin();

-- ============ FEATURE 6: personal_crew (Close Friends) ============
CREATE TABLE public.personal_crew (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  crew_member_user_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, crew_member_user_id),
  CHECK (owner_user_id <> crew_member_user_id)
);
CREATE INDEX personal_crew_owner_idx ON public.personal_crew (owner_user_id);
ALTER TABLE public.personal_crew ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views own crew"
  ON public.personal_crew FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);
CREATE POLICY "Owner adds to own crew"
  ON public.personal_crew FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owner removes from own crew"
  ON public.personal_crew FOR DELETE TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE OR REPLACE FUNCTION public.add_to_personal_crew(p_member_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_count integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_user = p_member_id THEN RAISE EXCEPTION 'Cannot add yourself'; END IF;
  SELECT COUNT(*) INTO v_count FROM public.personal_crew WHERE owner_user_id = v_user;
  IF v_count >= 8 THEN RAISE EXCEPTION 'Crew is full (max 8)'; END IF;
  INSERT INTO public.personal_crew (owner_user_id, crew_member_user_id)
  VALUES (v_user, p_member_id)
  ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END;
$$;

ALTER TABLE public.lineup_meetups ADD COLUMN IF NOT EXISTS crew_first boolean NOT NULL DEFAULT false;
