CREATE TABLE public.watch_parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  venue_name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  game_label TEXT NOT NULL,
  game_id UUID,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_attendees INTEGER NOT NULL DEFAULT 20,
  rsvps UUID[] NOT NULL DEFAULT '{}'::uuid[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_parties TO authenticated;
GRANT ALL ON public.watch_parties TO service_role;

ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view watch parties"
ON public.watch_parties FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can host watch parties"
ON public.watch_parties FOR INSERT TO authenticated
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update own watch party"
ON public.watch_parties FOR UPDATE TO authenticated
USING (auth.uid() = host_id);

CREATE POLICY "Attendees can RSVP toggle"
ON public.watch_parties FOR UPDATE TO authenticated
USING (auth.uid() = ANY(rsvps) OR true)
WITH CHECK (true);

CREATE POLICY "Host can delete own watch party"
ON public.watch_parties FOR DELETE TO authenticated
USING (auth.uid() = host_id);

CREATE INDEX idx_watch_parties_start_time ON public.watch_parties(start_time);

CREATE OR REPLACE FUNCTION public.toggle_watch_party_rsvp(_party_id UUID)
RETURNS public.watch_parties
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _row public.watch_parties;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _row FROM public.watch_parties WHERE id = _party_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Watch party not found';
  END IF;

  IF _uid = ANY(_row.rsvps) THEN
    UPDATE public.watch_parties
      SET rsvps = array_remove(rsvps, _uid), updated_at = now()
      WHERE id = _party_id
      RETURNING * INTO _row;
  ELSE
    IF array_length(_row.rsvps, 1) IS NOT NULL AND array_length(_row.rsvps, 1) >= _row.max_attendees THEN
      RAISE EXCEPTION 'Watch party is full';
    END IF;
    UPDATE public.watch_parties
      SET rsvps = array_append(rsvps, _uid), updated_at = now()
      WHERE id = _party_id
      RETURNING * INTO _row;
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_watch_party_rsvp(UUID) TO authenticated;

CREATE TRIGGER update_watch_parties_updated_at
BEFORE UPDATE ON public.watch_parties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();