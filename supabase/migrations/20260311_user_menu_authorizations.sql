create table if not exists public.user_menu_authorizations (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  menucmd text not null,
  accesslevel text not null default 'NONE' check (accesslevel in ('FULL', 'NONE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, menucmd)
);

create index if not exists user_menu_authorizations_user_id_idx on public.user_menu_authorizations(user_id);
create index if not exists user_menu_authorizations_menucmd_idx on public.user_menu_authorizations(menucmd);

drop trigger if exists set_user_menu_authorizations_updated_at on public.user_menu_authorizations;
create trigger set_user_menu_authorizations_updated_at
before update on public.user_menu_authorizations
for each row execute procedure public.set_updated_at();

alter table public.user_menu_authorizations enable row level security;

drop policy if exists "user_menu_authorizations_select_superadmin" on public.user_menu_authorizations;
create policy "user_menu_authorizations_select_superadmin"
on public.user_menu_authorizations for select
to authenticated
using (public.is_superadmin(auth.uid()));

drop policy if exists "user_menu_authorizations_insert_superadmin" on public.user_menu_authorizations;
create policy "user_menu_authorizations_insert_superadmin"
on public.user_menu_authorizations for insert
to authenticated
with check (public.is_superadmin(auth.uid()));

drop policy if exists "user_menu_authorizations_update_superadmin" on public.user_menu_authorizations;
create policy "user_menu_authorizations_update_superadmin"
on public.user_menu_authorizations for update
to authenticated
using (public.is_superadmin(auth.uid()))
with check (public.is_superadmin(auth.uid()));

drop policy if exists "user_menu_authorizations_delete_superadmin" on public.user_menu_authorizations;
create policy "user_menu_authorizations_delete_superadmin"
on public.user_menu_authorizations for delete
to authenticated
using (public.is_superadmin(auth.uid()));
