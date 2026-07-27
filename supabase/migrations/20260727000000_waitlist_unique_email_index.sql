-- Dedupe waitlist signups regardless of case; callers already lowercase email
-- before insert, but a case-insensitive unique index enforces it at the DB level.
CREATE UNIQUE INDEX waitlist_email_lower_unique_idx ON public.waitlist (lower(email));
