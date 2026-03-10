alter table public.businesses
add column if not exists activation_status text;

update public.businesses
set activation_status = coalesce(activation_status, 'pending');

alter table public.businesses
alter column activation_status set default 'pending';

alter table public.businesses
alter column activation_status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_activation_status_check'
  ) then
    alter table public.businesses
    add constraint businesses_activation_status_check
    check (activation_status in ('pending', 'active', 'suspended'));
  end if;
end
$$;
