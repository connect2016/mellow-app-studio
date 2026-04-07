
-- Add new columns to scoring_sessions
ALTER TABLE public.scoring_sessions
  ADD COLUMN IF NOT EXISTS active_scorer_id uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS active_batter integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS finalized_at timestamp with time zone DEFAULT NULL;

-- Add scored_by to scoring_entries
ALTER TABLE public.scoring_entries
  ADD COLUMN IF NOT EXISTS scored_by uuid DEFAULT NULL;

-- Allow session members to update scoring_sessions (for Pass the Pencil and finalize)
CREATE POLICY "Members can update session state"
ON public.scoring_sessions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scoring_session_members
    WHERE scoring_session_members.session_id = scoring_sessions.id
    AND scoring_session_members.user_id = auth.uid()
  )
);

-- Add unique constraint on scoring_entries for upsert if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scoring_entries_session_inning_half_key'
  ) THEN
    ALTER TABLE public.scoring_entries
      ADD CONSTRAINT scoring_entries_session_inning_half_key UNIQUE (session_id, inning, half);
  END IF;
END $$;
