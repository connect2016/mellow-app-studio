
-- Game memories table for photos from meetups
CREATE TABLE public.game_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  caption TEXT,
  location_tag TEXT NOT NULL DEFAULT 'Wrigley Field',
  tagged_users UUID[] NOT NULL DEFAULT '{}',
  game_id UUID REFERENCES public.games(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_memories ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view memories
CREATE POLICY "Anyone can view memories"
  ON public.game_memories FOR SELECT
  TO authenticated
  USING (true);

-- Users can create their own memories
CREATE POLICY "Users can create memories"
  ON public.game_memories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own memories
CREATE POLICY "Users can delete own memories"
  ON public.game_memories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for live story feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_memories;
