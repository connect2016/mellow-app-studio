-- Grant admins read/update access to the report tables. Previously neither
-- table had any policy allowing staff to see submitted reports at all, and
-- user_reports had no UPDATE policy whatsoever (status could never move off
-- 'pending' from the client).

CREATE POLICY "Admins can view all user reports"
  ON public.user_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user reports"
  ON public.user_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all meetup reports"
  ON public.meetup_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update meetup reports"
  ON public.meetup_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
