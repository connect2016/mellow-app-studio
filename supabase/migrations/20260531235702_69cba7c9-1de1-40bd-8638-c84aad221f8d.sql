CREATE TABLE public.bar_partners_waitlist (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    offer_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.bar_partners_waitlist TO anon;
GRANT SELECT, INSERT ON public.bar_partners_waitlist TO authenticated;
GRANT ALL ON public.bar_partners_waitlist TO service_role;

ALTER TABLE public.bar_partners_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit partner interest"
ON public.bar_partners_waitlist
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can view own submissions"
ON public.bar_partners_waitlist
FOR SELECT
TO public
USING (true);