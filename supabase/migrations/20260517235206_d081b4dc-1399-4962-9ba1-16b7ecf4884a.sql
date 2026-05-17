-- Priority 1: Fan Streak + Game Day Notifications schema
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fan_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_date date,
  ADD COLUMN IF NOT EXISTS streak_freezes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_total_game_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS game_day_notifications boolean NOT NULL DEFAULT true;

-- Atomic streak update — returns the new state plus whether a reset happened.
CREATE OR REPLACE FUNCTION public.record_fan_streak_open(p_game_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_prev_date date;
  v_streak integer;
  v_freezes integer;
  v_total integer;
  v_reset boolean := false;
  v_used_freeze boolean := false;
  v_earned_freeze boolean := false;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_game_date IS NULL THEN
    RAISE EXCEPTION 'game_date required';
  END IF;

  SELECT last_streak_date, fan_streak, streak_freezes, streak_total_game_days
    INTO v_prev_date, v_streak, v_freezes, v_total
    FROM public.profiles WHERE user_id = v_user FOR UPDATE;

  -- Already counted today
  IF v_prev_date = p_game_date THEN
    RETURN jsonb_build_object(
      'fan_streak', v_streak,
      'streak_freezes', v_freezes,
      'reset', false,
      'used_freeze', false,
      'earned_freeze', false,
      'already_counted', true
    );
  END IF;

  IF v_prev_date IS NULL THEN
    v_streak := 1;
  ELSIF v_prev_date = p_game_date - 1 THEN
    v_streak := v_streak + 1;
  ELSIF v_prev_date = p_game_date - 2 AND v_freezes > 0 THEN
    v_streak := v_streak + 1;
    v_freezes := v_freezes - 1;
    v_used_freeze := true;
  ELSE
    v_streak := 1;
    v_reset := true;
  END IF;

  v_total := v_total + 1;

  -- Earn a freeze every 10 game-day opens (cap 3 banked)
  IF v_total > 0 AND v_total % 10 = 0 AND v_freezes < 3 THEN
    v_freezes := v_freezes + 1;
    v_earned_freeze := true;
  END IF;

  UPDATE public.profiles
     SET fan_streak = v_streak,
         streak_freezes = v_freezes,
         streak_total_game_days = v_total,
         last_streak_date = p_game_date
   WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'fan_streak', v_streak,
    'streak_freezes', v_freezes,
    'reset', v_reset,
    'used_freeze', v_used_freeze,
    'earned_freeze', v_earned_freeze,
    'already_counted', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_fan_streak_open(date) TO authenticated;