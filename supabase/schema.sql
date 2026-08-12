-- Value Intelligence Hub Supabase schema
-- Run this in a new Supabase project's SQL editor before wiring the React app to Supabase Auth.

create type public.portal_role as enum ('owner', 'advisor', 'client');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.portal_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text not null,
  data_quality text not null default 'demo',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_memberships (
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.portal_role not null,
  created_at timestamptz not null default now(),
  primary key (company_id, profile_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.portal_role not null,
  company_id uuid references public.companies(id) on delete cascade,
  token text not null unique,
  status public.invitation_status not null default 'pending',
  invited_by uuid not null references public.profiles(id),
  accepted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create table public.company_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payload jsonb not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  source_type text not null check (source_type in ('qbo', 'crm_ops')),
  file_name text not null,
  storage_path text not null,
  import_summary jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.company_snapshots enable row level security;
alter table public.uploads enable row level security;

create or replace function public.current_profile_role()
returns public.portal_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.can_access_company(company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.company_memberships m on m.profile_id = p.id and m.company_id = company
    where p.id = auth.uid()
      and (p.role = 'owner' or m.profile_id is not null)
  )
$$;

create policy "profiles can read self" on public.profiles
  for select using (id = auth.uid() or public.current_profile_role() = 'owner');

create policy "owners can manage profiles" on public.profiles
  for all using (public.current_profile_role() = 'owner') with check (public.current_profile_role() = 'owner');

create policy "members can read companies" on public.companies
  for select using (public.can_access_company(id));

create policy "owners and advisors can create companies" on public.companies
  for insert with check (public.current_profile_role() in ('owner', 'advisor'));

create policy "owners and advisors can update accessible companies" on public.companies
  for update using (public.current_profile_role() in ('owner', 'advisor') and public.can_access_company(id));

create policy "members can read memberships" on public.company_memberships
  for select using (public.current_profile_role() = 'owner' or profile_id = auth.uid() or public.can_access_company(company_id));

create policy "owners and advisors can manage memberships" on public.company_memberships
  for all using (public.current_profile_role() in ('owner', 'advisor')) with check (public.current_profile_role() in ('owner', 'advisor'));

create policy "owners and advisors can manage invites" on public.invitations
  for all using (public.current_profile_role() in ('owner', 'advisor')) with check (public.current_profile_role() in ('owner', 'advisor'));

create policy "members can read snapshots" on public.company_snapshots
  for select using (public.can_access_company(company_id));

create policy "owners and advisors can write snapshots" on public.company_snapshots
  for insert with check (public.current_profile_role() in ('owner', 'advisor') and public.can_access_company(company_id));

create policy "members can read uploads" on public.uploads
  for select using (public.can_access_company(company_id));

create policy "owners and advisors can write uploads" on public.uploads
  for insert with check (public.current_profile_role() in ('owner', 'advisor') and public.can_access_company(company_id));
