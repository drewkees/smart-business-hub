-- Allow any authenticated user to manage system menu schema records.

drop policy if exists "schemas_select_superadmin" on public.schemas;
drop policy if exists "schemas_insert_superadmin" on public.schemas;
drop policy if exists "schemas_update_superadmin" on public.schemas;
drop policy if exists "schemas_delete_superadmin" on public.schemas;

create policy "schemas_select_authenticated"
on public.schemas for select
to authenticated
using (true);

create policy "schemas_insert_authenticated"
on public.schemas for insert
to authenticated
with check (true);

create policy "schemas_update_authenticated"
on public.schemas for update
to authenticated
using (true)
with check (true);

create policy "schemas_delete_authenticated"
on public.schemas for delete
to authenticated
using (true);
