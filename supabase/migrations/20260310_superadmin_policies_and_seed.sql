-- Superadmin policies and helper grant function

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

drop policy if exists "businesses_select_by_membership" on public.businesses;
create policy "businesses_select_by_membership"
on public.businesses for select
to authenticated
using (
  public.is_superadmin(auth.uid())
  or owner_user_id = auth.uid()
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = businesses.id
  )
);

drop policy if exists "businesses_update_by_owner" on public.businesses;
create policy "businesses_update_by_owner"
on public.businesses for update
to authenticated
using (
  public.is_superadmin(auth.uid())
  or owner_user_id = auth.uid()
)
with check (
  public.is_superadmin(auth.uid())
  or owner_user_id = auth.uid()
);

drop policy if exists "branches_select_by_membership" on public.branches;
create policy "branches_select_by_membership"
on public.branches for select
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = branches.business_id
  )
  or exists (
    select 1
    from public.businesses b
    where b.id = branches.business_id
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "branches_update_by_business_owner" on public.branches;
create policy "branches_update_by_business_owner"
on public.branches for update
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = branches.business_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = branches.business_id
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "memberships_select_own" on public.user_memberships;
create policy "memberships_select_own"
on public.user_memberships for select
to authenticated
using (
  public.is_superadmin(auth.uid())
  or user_id = auth.uid()
);

create or replace function public.grant_superadmin_by_email(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  select u.id
  into target_user_id
  from auth.users u
  where lower(u.email) = lower(target_email)
  limit 1;

  if target_user_id is null then
    raise exception 'User with email % not found in auth.users', target_email;
  end if;

  if not exists (
    select 1
    from public.user_memberships m
    where m.user_id = target_user_id
      and m.role = 'superadmin'
  ) then
    insert into public.user_memberships (user_id, role)
    values (target_user_id, 'superadmin');
  end if;
end;
$$;

revoke all on function public.grant_superadmin_by_email(text) from public;
grant execute on function public.grant_superadmin_by_email(text) to service_role;
