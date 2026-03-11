-- Fix auth user lookup RPC auth check for environments using users_memberships

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
declare
  has_superadmin boolean := false;
begin
  -- Prefer users_memberships if present
  if to_regclass('public.users_memberships') is not null then
    select exists (
      select 1
      from public.users_memberships m
      where m.user_id = auth.uid()
        and m.role = 'superadmin'
    ) into has_superadmin;
  end if;

  -- Fallback to user_memberships if needed
  if not has_superadmin and to_regclass('public.user_memberships') is not null then
    select exists (
      select 1
      from public.user_memberships m
      where m.user_id = auth.uid()
        and m.role = 'superadmin'
    ) into has_superadmin;
  end if;

  if not has_superadmin then
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

