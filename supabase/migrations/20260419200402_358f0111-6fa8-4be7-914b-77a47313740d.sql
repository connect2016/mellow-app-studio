
-- ============ TABLES ============

CREATE TABLE public.bar_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'finalized'
  finalized_option_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.bar_plan_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.bar_plans(id) ON DELETE CASCADE,
  added_by UUID NOT NULL,
  bar_name TEXT NOT NULL,
  bar_slug TEXT, -- nullable: only set when picked from curated guide
  address TEXT,
  emoji TEXT DEFAULT '🍻',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.bar_plan_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  option_id UUID NOT NULL REFERENCES public.bar_plan_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (option_id, user_id)
);

CREATE TABLE public.bar_plan_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.bar_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bar_plans_crew ON public.bar_plans(crew_id, created_at DESC);
CREATE INDEX idx_bar_plan_options_plan ON public.bar_plan_options(plan_id);
CREATE INDEX idx_bar_plan_votes_option ON public.bar_plan_votes(option_id);
CREATE INDEX idx_bar_plan_comments_plan ON public.bar_plan_comments(plan_id, created_at);

-- ============ updated_at trigger ============

CREATE TRIGGER trg_bar_plans_updated_at
BEFORE UPDATE ON public.bar_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RLS ============

ALTER TABLE public.bar_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_plan_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_plan_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_plan_comments ENABLE ROW LEVEL SECURITY;

-- bar_plans: crew members only
CREATE POLICY "Crew members can view plans"
ON public.bar_plans FOR SELECT TO authenticated
USING (public.is_crew_member(auth.uid(), crew_id));

CREATE POLICY "Crew members can create plans"
ON public.bar_plans FOR INSERT TO authenticated
WITH CHECK (auth.uid() = creator_id AND public.is_crew_member(auth.uid(), crew_id));

CREATE POLICY "Plan creator can update plan"
ON public.bar_plans FOR UPDATE TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Plan creator can delete plan"
ON public.bar_plans FOR DELETE TO authenticated
USING (auth.uid() = creator_id);

-- bar_plan_options: crew members only (via plan->crew)
CREATE POLICY "Crew members can view options"
ON public.bar_plan_options FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.bar_plans p
  WHERE p.id = bar_plan_options.plan_id
    AND public.is_crew_member(auth.uid(), p.crew_id)
));

CREATE POLICY "Crew members can add options"
ON public.bar_plan_options FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = added_by
  AND EXISTS (
    SELECT 1 FROM public.bar_plans p
    WHERE p.id = bar_plan_options.plan_id
      AND public.is_crew_member(auth.uid(), p.crew_id)
  )
);

CREATE POLICY "Adder can remove their option"
ON public.bar_plan_options FOR DELETE TO authenticated
USING (auth.uid() = added_by);

-- bar_plan_votes
CREATE POLICY "Crew members can view votes"
ON public.bar_plan_votes FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.bar_plan_options o
  JOIN public.bar_plans p ON p.id = o.plan_id
  WHERE o.id = bar_plan_votes.option_id
    AND public.is_crew_member(auth.uid(), p.crew_id)
));

CREATE POLICY "Crew members can vote"
ON public.bar_plan_votes FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.bar_plan_options o
    JOIN public.bar_plans p ON p.id = o.plan_id
    WHERE o.id = bar_plan_votes.option_id
      AND public.is_crew_member(auth.uid(), p.crew_id)
  )
);

CREATE POLICY "Users can remove own votes"
ON public.bar_plan_votes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- bar_plan_comments
CREATE POLICY "Crew members can view comments"
ON public.bar_plan_comments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.bar_plans p
  WHERE p.id = bar_plan_comments.plan_id
    AND public.is_crew_member(auth.uid(), p.crew_id)
));

CREATE POLICY "Crew members can comment"
ON public.bar_plan_comments FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.bar_plans p
    WHERE p.id = bar_plan_comments.plan_id
      AND public.is_crew_member(auth.uid(), p.crew_id)
  )
);

CREATE POLICY "Users can delete own comments"
ON public.bar_plan_comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============ Realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.bar_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bar_plan_options;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bar_plan_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bar_plan_comments;
