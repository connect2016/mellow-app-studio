-- Adds a short, public "status note" that appears as a speech bubble on a fan's
-- map pin. Applied to production via the Supabase dashboard on 2026-07-27; this
-- migration records that state for repo parity.

-- 1. Column + hard length cap
alter table public.profiles
  add column if not exists checkin_status_note text;

alter table public.profiles
  drop constraint if exists checkin_status_note_len;
alter table public.profiles
  add constraint checkin_status_note_len
  check (checkin_status_note is null or char_length(checkin_status_note) <= 60);

-- 2. Rebuild get_map_fans to return the note (only when the check-in hasn't expired).
--    Return type changed, so drop first.
drop function if exists public.get_map_fans();

create or replace function public.get_map_fans()
 returns table(fan_user_id uuid, fan_display_name text, fan_profile_photo text, fan_game_status text, fan_wrigley_section text, fan_wrigleyville_bar text, fan_gameday_intents text[], fan_fan_style text[], fan_location_last_set_at timestamp with time zone, fan_gameday_persona text, fan_intent text[], fan_latitude double precision, fan_longitude double precision, fan_status_note text)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  six_hours_ago timestamptz := now() - interval '6 hours';
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    p.user_id,
    p.display_name,
    p.profile_photo,
    p.game_status,
    p.wrigley_section,
    p.wrigleyville_bar,
    p.gameday_intents,
    p.fan_style,
    p.location_last_set_at,
    p.gameday_persona,
    p.intent,
    case when ul.latitude is not null then ul.latitude + (random() - 0.5) * 0.003 else null end,
    case when ul.longitude is not null then ul.longitude + (random() - 0.5) * 0.003 else null end,
    case
      when p.checkin_status_note is not null
        and p.checkin_expires_at is not null
        and p.checkin_expires_at > now()
      then p.checkin_status_note
      else null
    end
  from public.profiles p
  left join public.user_locations ul on ul.user_id = p.user_id
  where p.is_banned = false
    and p.onboarding_completed = true
    and p.game_status is distinct from 'NotSet'
    and p.location_last_set_at >= six_hours_ago
    and p.user_id != auth.uid()
    and not (
      p.home_lat is not null and p.home_lng is not null
      and ul.latitude is not null and ul.longitude is not null
      and abs(ul.latitude - p.home_lat) < 0.0009
      and abs(ul.longitude - p.home_lng) < 0.0009
    )
    and not (
      p.work_lat is not null and p.work_lng is not null
      and ul.latitude is not null and ul.longitude is not null
      and abs(ul.latitude - p.work_lat) < 0.0009
      and abs(ul.longitude - p.work_lng) < 0.0009
    )
  limit 200;
end;
$function$;

-- 3. Restore auth-gated execute (drop reset grants)
grant execute on function public.get_map_fans() to authenticated;
revoke execute on function public.get_map_fans() from anon;
