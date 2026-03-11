-- Suppliers table for tenant-scoped vendor management

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create index if not exists suppliers_business_id_idx on public.suppliers(business_id);
create index if not exists suppliers_name_idx on public.suppliers(name);

drop trigger if exists set_suppliers_updated_at on public.suppliers;
create trigger set_suppliers_updated_at
before update on public.suppliers
for each row execute procedure public.set_updated_at();

alter table public.suppliers enable row level security;

drop policy if exists "suppliers_select_by_membership" on public.suppliers;
create policy "suppliers_select_by_membership"
on public.suppliers for select
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = suppliers.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = suppliers.business_id
  )
);

drop policy if exists "suppliers_insert_by_membership" on public.suppliers;
create policy "suppliers_insert_by_membership"
on public.suppliers for insert
to authenticated
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = suppliers.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = suppliers.business_id
      and m.role in ('admin', 'cashier')
  )
);

drop policy if exists "suppliers_update_by_membership" on public.suppliers;
create policy "suppliers_update_by_membership"
on public.suppliers for update
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = suppliers.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = suppliers.business_id
      and m.role in ('admin', 'cashier')
  )
)
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = suppliers.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = suppliers.business_id
      and m.role in ('admin', 'cashier')
  )
);
