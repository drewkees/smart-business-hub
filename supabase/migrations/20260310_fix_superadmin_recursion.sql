-- Fix stack depth recursion caused by is_superadmin() + user_memberships RLS

create or replace function public.is_superadmin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_memberships m
    where m.user_id = uid
      and m.role = 'superadmin'
  );
$$;

revoke all on function public.is_superadmin(uuid) from public;
grant execute on function public.is_superadmin(uuid) to authenticated;

drop policy if exists "memberships_select_own" on public.user_memberships;
create policy "memberships_select_own"
on public.user_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_superadmin(auth.uid())
);
