-- Business-level configurable settings

create table if not exists public.business_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  notification_low_stock boolean not null default true,
  notification_orders boolean not null default true,
  notification_reports boolean not null default false,
  notification_channel text not null default 'inapp' check (notification_channel in ('inapp', 'email', 'both')),
  require_pin_on_sale boolean not null default false,
  two_factor_required boolean not null default false,
  session_timeout_minutes integer not null default 60 check (session_timeout_minutes between 5 and 1440),
  theme_mode text not null default 'system' check (theme_mode in ('light', 'dark', 'system')),
  accent_color text not null default 'blue',
  compact_mode boolean not null default false,
  tax_rate numeric(6,2) not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  service_charge_rate numeric(6,2) not null default 0 check (service_charge_rate >= 0 and service_charge_rate <= 100),
  allow_manual_discount boolean not null default true,
  receipt_footer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_settings_updated_at_idx on public.business_settings(updated_at);

drop trigger if exists set_business_settings_updated_at on public.business_settings;
create trigger set_business_settings_updated_at
before update on public.business_settings
for each row execute procedure public.set_updated_at();

alter table public.business_settings enable row level security;

drop policy if exists "business_settings_select_by_membership" on public.business_settings;
create policy "business_settings_select_by_membership"
on public.business_settings for select
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = business_settings.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = business_settings.business_id
  )
);

drop policy if exists "business_settings_insert_by_admin" on public.business_settings;
create policy "business_settings_insert_by_admin"
on public.business_settings for insert
to authenticated
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = business_settings.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = business_settings.business_id
      and m.role in ('admin')
  )
);

drop policy if exists "business_settings_update_by_admin" on public.business_settings;
create policy "business_settings_update_by_admin"
on public.business_settings for update
to authenticated
using (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = business_settings.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = business_settings.business_id
      and m.role in ('admin')
  )
)
with check (
  public.is_superadmin(auth.uid())
  or exists (
    select 1
    from public.businesses b
    where b.id = business_settings.business_id
      and b.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.user_memberships m
    where m.user_id = auth.uid()
      and m.business_id = business_settings.business_id
      and m.role in ('admin')
  )
);
