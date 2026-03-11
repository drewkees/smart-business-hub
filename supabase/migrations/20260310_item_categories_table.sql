-- Item categories per business

create table if not exists public.item_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create index if not exists item_categories_business_id_idx on public.item_categories(business_id);
create index if not exists item_categories_name_idx on public.item_categories(name);

drop trigger if exists set_item_categories_updated_at on public.item_categories;
create trigger set_item_categories_updated_at
before update on public.item_categories
for each row execute procedure public.set_updated_at();

alter table public.item_categories enable row level security;

drop policy if exists "item_categories_select_by_membership" on public.item_categories;
create policy "item_categories_select_by_membership"
on public.item_categories for select
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = item_categories.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = item_categories.business_id
  )
);

drop policy if exists "item_categories_insert_by_membership" on public.item_categories;
create policy "item_categories_insert_by_membership"
on public.item_categories for insert
to authenticated
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = item_categories.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = item_categories.business_id
      and m.role in ('admin', 'cashier')
  )
);

drop policy if exists "item_categories_update_by_membership" on public.item_categories;
create policy "item_categories_update_by_membership"
on public.item_categories for update
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = item_categories.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = item_categories.business_id
      and m.role in ('admin', 'cashier')
  )
)
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = item_categories.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = item_categories.business_id
      and m.role in ('admin', 'cashier')
  )
);
