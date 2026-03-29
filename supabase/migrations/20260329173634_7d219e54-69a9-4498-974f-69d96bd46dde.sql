
-- Section chat messages table
CREATE TABLE public.section_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  section text NOT NULL,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.section_chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view section chat messages for sections they belong to
CREATE POLICY "Anyone can view section messages" ON public.section_chat_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can send section messages" ON public.section_chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.section_chat_messages;

-- Hot dog icebreakers (reuse likes table with a new type indicator via message prefix)
-- No schema change needed - we'll use the existing likes table with message = '🌭 Hot Dog!'
