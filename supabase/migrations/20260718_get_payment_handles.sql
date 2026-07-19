create or replace function public.get_payment_handles(p_user_id uuid)
returns table (venmo_handle text, cashapp_cashtag text, paypal_handle text)
language sql
security definer
set search_path = public
stable
as $$
  select p.venmo_handle, p.cashapp_cashtag, p.paypal_handle
  from profiles p
  where p.user_id = p_user_id
    and auth.uid() is not null;
$$;

revoke execute on function public.get_payment_handles(uuid) from anon;
grant execute on function public.get_payment_handles(uuid) to authenticated;
