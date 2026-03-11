-- Inventory schema with separate stock movements (quantity in / quantity out)

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  sku text not null,
  name text not null,
  category text not null default 'General',
  supplier text,
  unit_price numeric(12,2) not null default 0,
  reorder_level integer not null default 0 check (reorder_level >= 0),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, sku)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  movement_type text not null check (movement_type in ('in', 'out')),
  quantity integer not null check (quantity > 0),
  reference_type text,
  reference_id text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists items_business_id_idx on public.items(business_id);
create index if not exists items_branch_id_idx on public.items(branch_id);
create index if not exists stock_movements_item_id_idx on public.stock_movements(item_id);
create index if not exists stock_movements_business_id_idx on public.stock_movements(business_id);
create index if not exists stock_movements_created_at_idx on public.stock_movements(created_at);

drop trigger if exists set_items_updated_at on public.items;
create trigger set_items_updated_at
before update on public.items
for each row execute procedure public.set_updated_at();

create or replace view public.inventory_item_stock_totals as
select
  i.id as item_id,
  coalesce(sum(case when sm.movement_type = 'in' then sm.quantity else 0 end), 0) as quantity_in,
  coalesce(sum(case when sm.movement_type = 'out' then sm.quantity else 0 end), 0) as quantity_out,
  coalesce(sum(case when sm.movement_type = 'in' then sm.quantity else 0 end), 0)
    - coalesce(sum(case when sm.movement_type = 'out' then sm.quantity else 0 end), 0) as current_stock
from public.items i
left join public.stock_movements sm on sm.item_id = i.id
group by i.id;

alter table public.items enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "items_select_by_membership" on public.items;
create policy "items_select_by_membership"
on public.items for select
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = items.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = items.business_id
  )
);

drop policy if exists "items_insert_by_membership" on public.items;
create policy "items_insert_by_membership"
on public.items for insert
to authenticated
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = items.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = items.business_id
      and m.role in ('admin', 'cashier')
  )
);

drop policy if exists "items_update_by_membership" on public.items;
create policy "items_update_by_membership"
on public.items for update
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = items.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = items.business_id
      and m.role in ('admin', 'cashier')
  )
)
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = items.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = items.business_id
      and m.role in ('admin', 'cashier')
  )
);

drop policy if exists "stock_movements_select_by_membership" on public.stock_movements;
create policy "stock_movements_select_by_membership"
on public.stock_movements for select
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = stock_movements.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = stock_movements.business_id
  )
);

drop policy if exists "stock_movements_insert_by_membership" on public.stock_movements;
create policy "stock_movements_insert_by_membership"
on public.stock_movements for insert
to authenticated
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = stock_movements.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = stock_movements.business_id
      and m.role in ('admin', 'cashier')
  )
);
