
-- Fix scoring_entries update policy
DROP POLICY "Members can update entries" ON public.scoring_entries;
CREATE POLICY "Members can update entries" ON public.scoring_entries
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.scoring_session_members
    WHERE session_id = scoring_entries.session_id AND user_id = auth.uid()
  ));

-- Fix scoring_timeline update policy
DROP POLICY "Members can update timeline" ON public.scoring_timeline;
CREATE POLICY "Members can update timeline" ON public.scoring_timeline
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.scoring_session_members
    WHERE session_id = scoring_timeline.session_id AND user_id = auth.uid()
  ));
