-- Security sweep follow-up (task 9):
--
-- 1) has_role(uuid, app_role) is a SECURITY DEFINER RLS-helper function with
--    no internal auth check. It has never had anon execute revoked, so any
--    anonymous caller could hit it directly via PostgREST RPC with an
--    arbitrary _user_id to enumerate who holds the 'admin' role. Restrict
--    execute to authenticated — src/components/AdminRoute.tsx already calls
--    it as an authenticated user to check its own role, so that path is
--    unaffected.
--
-- 2) award_user_points / award_ivy_leaf are SECURITY DEFINER functions
--    called directly from client code (useMissions.ts, useBarCheckins.ts,
--    useBucketList.ts, useIvyLeaves.ts) with fully client-supplied
--    _source/_source_id/_points/_amount. Neither function has ever
--    restricted anon execute, and — more importantly — neither is
--    idempotent: any authenticated user can replay the exact same RPC call
--    (e.g. the mission-claim request with a real missionId) to farm
--    unlimited points/ivy leaves for one real event. Add a per
--    (user, source, source_id) duplicate guard so a given source_id can
--    only ever pay out once; source-less repeatable actions (e.g.
--    bar_checkin, which intentionally omits source_id) are unaffected.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.award_user_points(
  _source text,
  _source_id uuid DEFAULT NULL,
  _points integer DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _points < 1 OR _points > 100 THEN
    RAISE EXCEPTION 'Points must be between 1 and 100';
  END IF;
  IF char_length(_source) > 100 THEN
    RAISE EXCEPTION 'Invalid source';
  END IF;

  IF _source_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_points
    WHERE user_id = auth.uid() AND source = _source AND source_id = _source_id
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.user_points (user_id, source, source_id, points)
  VALUES (auth.uid(), _source, _source_id, _points);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_user_points(text, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_user_points(text, uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.award_ivy_leaf(
  _source text,
  _source_id uuid DEFAULT NULL,
  _amount integer DEFAULT 1,
  _homestand_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _amount < 1 OR _amount > 10 THEN
    RAISE EXCEPTION 'Amount must be between 1 and 10';
  END IF;
  IF char_length(_source) > 100 THEN
    RAISE EXCEPTION 'Invalid source';
  END IF;

  IF _source_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.ivy_leaves
    WHERE user_id = auth.uid() AND source = _source AND source_id = _source_id
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.ivy_leaves (user_id, source, source_id, amount, homestand_id)
  VALUES (auth.uid(), _source, _source_id, _amount, _homestand_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_ivy_leaf(text, uuid, integer, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_ivy_leaf(text, uuid, integer, uuid) TO authenticated;
