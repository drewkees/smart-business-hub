-- App-facing users table synced from auth.users

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  user_id text,
  business_id uuid references public.businesses(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_business_id_idx on public.users(business_id);
create unique index if not exists users_business_user_id_unique_idx
on public.users (business_id, lower(user_id))
where user_id is not null and business_id is not null;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, user_id, business_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'user_id', ''),
    nullif(new.raw_user_meta_data->>'business_id', '')::uuid
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        user_id = excluded.user_id,
        business_id = excluded.business_id,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_auth_user_created();

insert into public.users (id, email, full_name, user_id, business_id)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  nullif(u.raw_user_meta_data->>'user_id', ''),
  nullif(u.raw_user_meta_data->>'business_id', '')::uuid
from auth.users u
on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      user_id = excluded.user_id,
      business_id = excluded.business_id,
      updated_at = now();

alter table public.users enable row level security;

drop policy if exists "users_select_own_or_membership" on public.users;
create policy "users_select_own_or_membership"
on public.users for select
to authenticated
using (
  id = auth.uid()
  or public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = users.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = users.business_id
      and m.role = 'admin'
  )
);

drop policy if exists "users_update_own_or_admin" on public.users;
create policy "users_update_own_or_admin"
on public.users for update
to authenticated
using (
  id = auth.uid()
  or public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = users.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = users.business_id
      and m.role = 'admin'
  )
)
with check (
  id = auth.uid()
  or public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = users.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = users.business_id
      and m.role = 'admin'
  )
);
