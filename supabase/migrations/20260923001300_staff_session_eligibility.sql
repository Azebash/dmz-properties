-- Treat Auth status as part of the effective staff role on every database read.
create or replace function private.current_staff_role()
returns public.staff_role
language sql stable security definer
set search_path = ''
as $$
  select p.role from public.staff_profiles p
  join auth.users u on u.id = p.user_id
  where p.user_id = (select auth.uid()) and p.active
    and u.email_confirmed_at is not null
    and nullif(u.encrypted_password, '') is not null
    and (u.banned_until is null or u.banned_until <= now())
$$;

drop policy "Users read own staff profile" on public.staff_profiles;
create policy "Users read own staff profile"
on public.staff_profiles for select to authenticated
using (user_id = (select auth.uid()) and private.is_staff());
