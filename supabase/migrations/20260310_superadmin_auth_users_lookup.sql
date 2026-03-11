-- Resolve auth user profile fields for superadmin user listing

create or replace function public.get_auth_users_by_ids(user_ids uuid[])
returns table (
  id uuid,
  email text,
  full_name text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_superadmin(auth.uid()) then
    raise exception 'Only superadmin can read auth user profiles.';
  end if;

  return query
  select
    u.id,
    u.email,
    coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(coalesce(u.email, ''), '@', 1)) as full_name
  from auth.users u
  where u.id = any(user_ids);
end;
$$;

revoke all on function public.get_auth_users_by_ids(uuid[]) from public;
grant execute on function public.get_auth_users_by_ids(uuid[]) to authenticated;
