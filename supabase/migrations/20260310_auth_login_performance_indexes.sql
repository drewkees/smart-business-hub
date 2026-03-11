-- Performance indexes for sign-in access resolution

create index if not exists user_memberships_user_id_created_at_idx
on public.user_memberships(user_id, created_at);

create index if not exists businesses_owner_user_id_created_at_idx
on public.businesses(owner_user_id, created_at);

create index if not exists branches_business_id_created_at_idx
on public.branches(business_id, created_at);
