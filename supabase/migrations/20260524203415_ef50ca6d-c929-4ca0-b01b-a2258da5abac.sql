
-- 1. Hide merchant_secret column from anon & authenticated roles
REVOKE SELECT (merchant_secret) ON public.merchants FROM anon, authenticated, PUBLIC;

-- 2. crew_event_votes INSERT: require crew membership
DROP POLICY IF EXISTS "Members can vote" ON public.crew_event_votes;
CREATE POLICY "Members can vote"
ON public.crew_event_votes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.crew_event_options o
    JOIN public.crew_events e ON e.id = o.event_id
    WHERE o.id = crew_event_votes.option_id
      AND public.is_crew_member(auth.uid(), e.crew_id)
  )
);

-- 3. scoring_predictions INSERT: require session membership
DROP POLICY IF EXISTS "Users can create predictions" ON public.scoring_predictions;
CREATE POLICY "Users can create predictions"
ON public.scoring_predictions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.scoring_session_members m
    WHERE m.session_id = scoring_predictions.session_id
      AND m.user_id = auth.uid()
  )
);

-- 4. scoring_timeline INSERT: require session membership
DROP POLICY IF EXISTS "Members can add timeline events" ON public.scoring_timeline;
CREATE POLICY "Members can add timeline events"
ON public.scoring_timeline
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.scoring_session_members m
    WHERE m.session_id = scoring_timeline.session_id
      AND m.user_id = auth.uid()
  )
);

-- 5. scoring_reactions INSERT: require session membership
DROP POLICY IF EXISTS "Members can post reactions" ON public.scoring_reactions;
CREATE POLICY "Members can post reactions"
ON public.scoring_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.scoring_session_members m
    WHERE m.session_id = scoring_reactions.session_id
      AND m.user_id = auth.uid()
  )
);
