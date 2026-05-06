INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public read public-assets') THEN
    CREATE POLICY "Public read public-assets" ON storage.objects FOR SELECT USING (bucket_id = 'public-assets');
  END IF;
END $$;