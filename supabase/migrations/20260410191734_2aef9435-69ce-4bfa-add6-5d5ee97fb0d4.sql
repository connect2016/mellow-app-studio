
-- Bar Check-ins table
CREATE TABLE public.bar_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  bar_name text NOT NULL,
  visibility text NOT NULL DEFAULT 'visible',
  checked_in_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '4 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bar_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible checkins"
  ON public.bar_checkins FOR SELECT TO authenticated
  USING (visibility = 'visible' OR auth.uid() = user_id);

CREATE POLICY "Users can create own checkins"
  ON public.bar_checkins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins"
  ON public.bar_checkins FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins"
  ON public.bar_checkins FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_bar_checkins_bar ON public.bar_checkins (bar_name);
CREATE INDEX idx_bar_checkins_expires ON public.bar_checkins (expires_at);

-- Pub Crawls table
CREATE TABLE public.pub_crawls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL,
  title text NOT NULL,
  start_bar text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'planning',
  invite_code text DEFAULT encode(extensions.gen_random_bytes(4), 'hex'),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pub_crawls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public crawls"
  ON public.pub_crawls FOR SELECT TO authenticated
  USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create crawls"
  ON public.pub_crawls FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update crawls"
  ON public.pub_crawls FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete crawls"
  ON public.pub_crawls FOR DELETE TO authenticated
  USING (auth.uid() = creator_id);

-- Pub Crawl Stops table
CREATE TABLE public.pub_crawl_stops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crawl_id uuid NOT NULL REFERENCES public.pub_crawls(id) ON DELETE CASCADE,
  bar_name text NOT NULL,
  stop_order integer NOT NULL DEFAULT 1,
  arrived_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pub_crawl_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crawl stops"
  ON public.pub_crawl_stops FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pub_crawls c
    WHERE c.id = pub_crawl_stops.crawl_id
    AND (c.is_public = true OR c.creator_id = auth.uid())
  ));

CREATE POLICY "Creators can add stops"
  ON public.pub_crawl_stops FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pub_crawls c
    WHERE c.id = pub_crawl_stops.crawl_id AND c.creator_id = auth.uid()
  ));

CREATE POLICY "Creators can update stops"
  ON public.pub_crawl_stops FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pub_crawls c
    WHERE c.id = pub_crawl_stops.crawl_id AND c.creator_id = auth.uid()
  ));

CREATE POLICY "Creators can delete stops"
  ON public.pub_crawl_stops FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pub_crawls c
    WHERE c.id = pub_crawl_stops.crawl_id AND c.creator_id = auth.uid()
  ));

-- Pub Crawl Members table
CREATE TABLE public.pub_crawl_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crawl_id uuid NOT NULL REFERENCES public.pub_crawls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(crawl_id, user_id)
);

ALTER TABLE public.pub_crawl_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crawl members"
  ON public.pub_crawl_members FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can join crawls"
  ON public.pub_crawl_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave crawls"
  ON public.pub_crawl_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for check-ins and crawl members
ALTER PUBLICATION supabase_realtime ADD TABLE public.bar_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pub_crawl_members;

-- Updated_at trigger for pub_crawls
CREATE TRIGGER update_pub_crawls_updated_at
  BEFORE UPDATE ON public.pub_crawls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
