
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated can read locations" ON public.user_locations;
DROP POLICY IF EXISTS "Anyone can view locations" ON public.user_locations;

-- Allow users to read only their own location
CREATE POLICY "Users can read own location"
ON public.user_locations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
