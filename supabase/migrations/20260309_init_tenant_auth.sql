-- Multi-tenant auth schema for BizPOS
-- Run in Supabase SQL editor or as a migration.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('superadmin', 'admin', 'cashier');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'business_type') then
    create type public.business_type as enum ('restaurant', 'rice', 'retail', 'grocery', 'pharmacy', 'hardware', 'salon');
  end if;
end
$$;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.business_type not null,
  activation_status text not null default 'pending' check (activation_status in ('pending', 'active', 'suspended')),
  email text,
  phone text,
  address text,
  logo_url text,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  is_configured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  location text not null,
  is_main boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists branches_one_main_per_business_idx
  on public.branches (business_id)
  where is_main = true;

create table if not exists public.user_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, business_id, branch_id, role)
);

create index if not exists user_memberships_user_id_idx on public.user_memberships(user_id);
create index if not exists user_memberships_business_id_idx on public.user_memberships(business_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_businesses_updated_at on public.businesses;
create trigger set_businesses_updated_at
before update on public.businesses
for each row execute procedure public.set_updated_at();

drop trigger if exists set_branches_updated_at on public.branches;
create trigger set_branches_updated_at
before update on public.branches
for each row execute procedure public.set_updated_at();

alter table public.businesses enable row level security;
alter table public.branches enable row level security;
alter table public.user_memberships enable row level security;

drop policy if exists "businesses_select_by_membership" on public.businesses;
create policy "businesses_select_by_membership"
on public.businesses for select
to authenticated
using (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = businesses.id
  )
);

drop policy if exists "businesses_insert_by_owner" on public.businesses;
create policy "businesses_insert_by_owner"
on public.businesses for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "businesses_update_by_owner" on public.businesses;
create policy "businesses_update_by_owner"
on public.businesses for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "branches_select_by_membership" on public.branches;
create policy "branches_select_by_membership"
on public.branches for select
to authenticated
using (
  exists (
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

drop policy if exists "branches_insert_by_business_owner" on public.branches;
create policy "branches_insert_by_business_owner"
on public.branches for insert
to authenticated
with check (
  exists (
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
  exists (
    select 1
    from public.businesses b
    where b.id = branches.business_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
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
using (user_id = auth.uid());

drop policy if exists "memberships_insert_for_self" on public.user_memberships;
create policy "memberships_insert_for_self"
on public.user_memberships for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "memberships_update_for_self" on public.user_memberships;
create policy "memberships_update_for_self"
on public.user_memberships for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Optional storage bucket for logos (run once)
-- insert into storage.buckets (id, name, public)
-- values ('business-logos', 'business-logos', true)
-- on conflict (id) do nothing;
