-- Blocking today only excludes users *I* blocked from my own views — it isn't
-- mutual, so someone I blocked can still message/see me. This helper returns
-- the union of "who I blocked" and "who blocked me" so every enforcement site
-- (client hooks, edge functions, the message-insert trigger) can share one
-- mutual-exclusion primitive instead of re-deriving it. SECURITY DEFINER is
-- required because computing "who has _user_id in their blocked_users array"
-- needs to scan other users' profiles rows, which the caller's own RLS
-- wouldn't otherwise permit — the function only ever returns bare ids.

CREATE OR REPLACE FUNCTION public.get_blocked_pair_ids(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT array_agg(DISTINCT x) FROM (
      SELECT unnest(p.blocked_users) AS x
      FROM public.profiles p WHERE p.user_id = _user_id
      UNION
      SELECT p2.user_id AS x
      FROM public.profiles p2
      WHERE _user_id = ANY(p2.blocked_users)
    ) t),
    '{}'::uuid[]
  );
$$;

REVOKE EXECUTE ON FUNCTION public.get_blocked_pair_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_blocked_pair_ids(uuid) TO authenticated;
