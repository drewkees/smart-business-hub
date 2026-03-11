-- Move settings storage into businesses table

alter table public.businesses
  add column if not exists notification_low_stock boolean not null default true,
  add column if not exists notification_orders boolean not null default true,
  add column if not exists notification_reports boolean not null default false,
  add column if not exists notification_channel text not null default 'inapp' check (notification_channel in ('inapp', 'email', 'both')),
  add column if not exists require_pin_on_sale boolean not null default false,
  add column if not exists two_factor_required boolean not null default false,
  add column if not exists session_timeout_minutes integer not null default 60 check (session_timeout_minutes between 5 and 1440),
  add column if not exists theme_mode text not null default 'system' check (theme_mode in ('light', 'dark', 'system')),
  add column if not exists accent_color text not null default 'blue',
  add column if not exists compact_mode boolean not null default false,
  add column if not exists tax_rate numeric(6,2) not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  add column if not exists service_charge_rate numeric(6,2) not null default 0 check (service_charge_rate >= 0 and service_charge_rate <= 100),
  add column if not exists allow_manual_discount boolean not null default true,
  add column if not exists receipt_footer text;

update public.businesses
set receipt_footer = 'Thank you for your purchase.'
where receipt_footer is null;
