-- Guests must be able to call get_public_profiles for public profile pages (/u/<id>).
-- The anon grant was lost when the function was recreated during duplicate-overload cleanup.
grant execute on function public.get_public_profiles to anon;
