CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_waitlist_source ON public.waitlist(source);
CREATE INDEX idx_waitlist_email ON public.waitlist(email);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(email) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(source) BETWEEN 1 AND 64
  );