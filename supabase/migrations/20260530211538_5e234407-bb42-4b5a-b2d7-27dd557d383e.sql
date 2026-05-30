CREATE OR REPLACE FUNCTION public.get_visible_checkins(p_user_ids uuid[])
RETURNS TABLE(user_id uuid, checkin_bar text, checkin_section text, checkin_expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.checkin_bar,
    CASE
      WHEN p.checkin_expires_at IS NULL OR p.checkin_expires_at < now() THEN NULL
      ELSE p.checkin_section
    END AS checkin_section,
    CASE
      WHEN p.checkin_expires_at IS NULL OR p.checkin_expires_at < now() THEN NULL
      ELSE p.checkin_expires_at
    END AS checkin_expires_at
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.user_id = ANY(p_user_ids)
    AND p.is_banned = false
    AND (
      EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.status = 'matched'
          AND (
            (m.user_a = auth.uid() AND m.user_b = p.user_id) OR
            (m.user_b = auth.uid() AND m.user_a = p.user_id)
          )
      )
      OR EXISTS (
        SELECT 1 FROM public.likes l
        WHERE l.from_user = auth.uid()
          AND l.to_user = p.user_id
      )
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_visible_checkins(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_visible_checkins(uuid[]) TO authenticated;