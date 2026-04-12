-- Create bucket list progress table
CREATE TABLE public.bucket_list_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_key TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_key)
);

ALTER TABLE public.bucket_list_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.bucket_list_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.bucket_list_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.bucket_list_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add gameday legend badge expiry to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gameday_legend_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;