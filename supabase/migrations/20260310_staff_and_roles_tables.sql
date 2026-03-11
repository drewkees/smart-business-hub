-- Staff and roles tables for tenant management

create table if not exists public.staff_roles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  code text,
  description text,
  permissions jsonb not null default '[]'::jsonb,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists staff_roles_business_name_unique_idx
on public.staff_roles (business_id, lower(name));

create unique index if not exists staff_roles_business_code_unique_idx
on public.staff_roles (business_id, lower(code))
where code is not null;

create index if not exists staff_roles_business_id_idx
on public.staff_roles (business_id);

drop trigger if exists set_staff_roles_updated_at on public.staff_roles;
create trigger set_staff_roles_updated_at
before update on public.staff_roles
for each row execute procedure public.set_updated_at();

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  role_id uuid references public.staff_roles(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  employee_code text,
  pin_code text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  hired_at date,
  last_login_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists staff_members_business_employee_code_unique_idx
on public.staff_members (business_id, employee_code)
where employee_code is not null;

create unique index if not exists staff_members_business_auth_user_unique_idx
on public.staff_members (business_id, auth_user_id)
where auth_user_id is not null;

create index if not exists staff_members_business_id_idx
on public.staff_members (business_id);

create index if not exists staff_members_branch_id_idx
on public.staff_members (branch_id);

create index if not exists staff_members_role_id_idx
on public.staff_members (role_id);

drop trigger if exists set_staff_members_updated_at on public.staff_members;
create trigger set_staff_members_updated_at
before update on public.staff_members
for each row execute procedure public.set_updated_at();

alter table public.staff_roles enable row level security;
alter table public.staff_members enable row level security;

drop policy if exists "staff_roles_select_by_membership" on public.staff_roles;
create policy "staff_roles_select_by_membership"
on public.staff_roles for select
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = staff_roles.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = staff_roles.business_id
  )
);

drop policy if exists "staff_roles_insert_by_admin" on public.staff_roles;
create policy "staff_roles_insert_by_admin"
on public.staff_roles for insert
to authenticated
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = staff_roles.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = staff_roles.business_id
      and m.role = 'admin'
  )
);

drop policy if exists "staff_roles_update_by_admin" on public.staff_roles;
create policy "staff_roles_update_by_admin"
on public.staff_roles for update
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = staff_roles.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = staff_roles.business_id
      and m.role = 'admin'
  )
)
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = staff_roles.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = staff_roles.business_id
      and m.role = 'admin'
  )
);

drop policy if exists "staff_members_select_by_membership" on public.staff_members;
create policy "staff_members_select_by_membership"
on public.staff_members for select
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = staff_members.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = staff_members.business_id
  )
);

drop policy if exists "staff_members_insert_by_admin" on public.staff_members;
create policy "staff_members_insert_by_admin"
on public.staff_members for insert
to authenticated
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = staff_members.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = staff_members.business_id
      and m.role = 'admin'
  )
);

drop policy if exists "staff_members_update_by_admin" on public.staff_members;
create policy "staff_members_update_by_admin"
on public.staff_members for update
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = staff_members.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = staff_members.business_id
      and m.role = 'admin'
  )
)
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = staff_members.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = staff_members.business_id
      and m.role = 'admin'
  )
);
