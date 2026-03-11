-- Rename inventory_items table to items (for existing databases)

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'inventory_items'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'items'
  ) then
    alter table public.inventory_items rename to items;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1 from pg_class
    where relkind = 'i' and relname = 'inventory_items_business_id_idx'
  ) then
    alter index public.inventory_items_business_id_idx rename to items_business_id_idx;
  end if;
  if exists (
    select 1 from pg_class
    where relkind = 'i' and relname = 'inventory_items_branch_id_idx'
  ) then
    alter index public.inventory_items_branch_id_idx rename to items_branch_id_idx;
  end if;
exception when undefined_table then
  null;
end
$$;

drop trigger if exists set_inventory_items_updated_at on public.items;
drop trigger if exists set_items_updated_at on public.items;
create trigger set_items_updated_at
before update on public.items
for each row execute procedure public.set_updated_at();

drop view if exists public.inventory_item_stock_totals;
create view public.inventory_item_stock_totals as
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

drop policy if exists "inventory_items_select_by_membership" on public.items;
drop policy if exists "inventory_items_insert_by_membership" on public.items;
drop policy if exists "inventory_items_update_by_membership" on public.items;
drop policy if exists "items_select_by_membership" on public.items;
drop policy if exists "items_insert_by_membership" on public.items;
drop policy if exists "items_update_by_membership" on public.items;

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
