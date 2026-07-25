-- d0c628d ("Repoint teammate hooks to buddy_requests") moved every CRUD hook
-- in useTeammates.ts (send/respond/remove/incoming/state) onto buddy_requests,
-- but missed get_teammate_ids — the function useTeammates() itself calls to
-- render the confirmed-teammates list (Dugout, MyCrewSection). It was still
-- reading the now-orphaned teammate_requests table, so every request accepted
-- since that repoint (writes now go to buddy_requests) never showed up as a
-- teammate. buddy_requests has the identical shape (requester_id,
-- recipient_id, status, responded_at, updated_at) and is the same table
-- say_hi_to_buddy() writes 'accepted' rows into, so it's a direct swap.
CREATE OR REPLACE FUNCTION public.get_teammate_ids(_user_id uuid)
RETURNS TABLE(teammate_id uuid, since timestamp with time zone)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT
    CASE WHEN br.requester_id = _user_id THEN br.recipient_id ELSE br.requester_id END AS teammate_id,
    COALESCE(br.responded_at, br.updated_at) AS since
  FROM public.buddy_requests br
  WHERE br.status = 'accepted'
    AND (br.requester_id = _user_id OR br.recipient_id = _user_id)
    AND auth.uid() = _user_id;
$func$;
