-- Orders and order items tables for tenant-scoped transaction tracking

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  order_number text not null,
  customer_name text,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'card', 'qr', 'bank_transfer', 'other')),
  status text not null default 'completed' check (status in ('pending', 'processing', 'completed', 'refunded', 'cancelled')),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, order_number)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  item_name text not null,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_business_id_idx on public.orders(business_id);
create index if not exists orders_branch_id_idx on public.orders(branch_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_business_id_idx on public.order_items(business_id);
create index if not exists order_items_item_id_idx on public.order_items(item_id);

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_select_by_membership" on public.orders;
create policy "orders_select_by_membership"
on public.orders for select
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = orders.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = orders.business_id
  )
);

drop policy if exists "orders_insert_by_membership" on public.orders;
create policy "orders_insert_by_membership"
on public.orders for insert
to authenticated
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = orders.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = orders.business_id
      and m.role in ('admin', 'cashier')
  )
);

drop policy if exists "orders_update_by_membership" on public.orders;
create policy "orders_update_by_membership"
on public.orders for update
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = orders.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = orders.business_id
      and m.role in ('admin', 'cashier')
  )
)
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = orders.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = orders.business_id
      and m.role in ('admin', 'cashier')
  )
);

drop policy if exists "order_items_select_by_membership" on public.order_items;
create policy "order_items_select_by_membership"
on public.order_items for select
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = order_items.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = order_items.business_id
  )
);

drop policy if exists "order_items_insert_by_membership" on public.order_items;
create policy "order_items_insert_by_membership"
on public.order_items for insert
to authenticated
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = order_items.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = order_items.business_id
      and m.role in ('admin', 'cashier')
  )
);

