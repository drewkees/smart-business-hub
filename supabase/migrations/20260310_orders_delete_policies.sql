-- Allow tenant members to delete orders (and order items when needed)

drop policy if exists "orders_delete_by_membership" on public.orders;
create policy "orders_delete_by_membership"
on public.orders for delete
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
);

drop policy if exists "order_items_delete_by_membership" on public.order_items;
create policy "order_items_delete_by_membership"
on public.order_items for delete
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
      and m.role in ('admin', 'cashier')
  )
);

