-- Add photo support for items

alter table public.items
add column if not exists photo_url text;

-- Optional storage bucket (run once if needed)
-- insert into storage.buckets (id, name, public)
-- values ('item-photos', 'item-photos', true)
-- on conflict (id) do nothing;
