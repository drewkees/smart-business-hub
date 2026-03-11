-- Enable branch CRUD for superadmin, business owner, and admin membership

drop policy if exists "branches_insert_by_business_owner" on public.branches;
drop policy if exists "branches_update_by_business_owner" on public.branches;
drop policy if exists "branches_delete_by_business_owner" on public.branches;
drop policy if exists "branches_insert_by_membership" on public.branches;
drop policy if exists "branches_update_by_membership" on public.branches;
drop policy if exists "branches_delete_by_membership" on public.branches;

create policy "branches_insert_by_membership"
on public.branches for insert
to authenticated
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = branches.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = branches.business_id
      and m.role = 'admin'
  )
);

create policy "branches_update_by_membership"
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
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = branches.business_id
      and m.role = 'admin'
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
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = branches.business_id
      and m.role = 'admin'
  )
);

create policy "branches_delete_by_membership"
on public.branches for delete
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = branches.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = branches.business_id
      and m.role = 'admin'
  )
);

