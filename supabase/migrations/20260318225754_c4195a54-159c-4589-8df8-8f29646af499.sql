-- Vibe posts table
CREATE TABLE public.vibe_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  location_tag text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '12 hours')
);

ALTER TABLE public.vibe_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vibe posts"
  ON public.vibe_posts FOR SELECT TO authenticated
  USING (expires_at > now());

CREATE POLICY "Users can create vibe posts"
  ON public.vibe_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vibe posts"
  ON public.vibe_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Storage bucket for vibe media
INSERT INTO storage.buckets (id, name, public)
VALUES ('vibe-media', 'vibe-media', true);

CREATE POLICY "Authenticated users can upload vibe media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vibe-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view vibe media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vibe-media');

CREATE POLICY "Users can delete own vibe media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vibe-media' AND (storage.foldername(name))[1] = auth.uid()::text);