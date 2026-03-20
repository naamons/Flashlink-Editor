-- =============================================================
-- ECU Editor – Initial Schema
-- Migration: 20260320_initial_schema.sql
-- =============================================================

-- ─── Extensions ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ──────────────────────────────────────────────────
-- Extends the built-in auth.users table with app-specific data
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── ECU Projects ──────────────────────────────────────────────
create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  description     text,
  ecu_def         text,                  -- e.g. 'SIM2K-250'
  calibration_id  text,                  -- e.g. 'CNPNKM__FT5A'
  is_public       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Project Versions ──────────────────────────────────────────
create table public.project_versions (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  name            text not null,          -- user-supplied label, e.g. 'Stage 2 tune'
  notes           text,
  bin_data        bytea,                  -- the full modified .bin stored as bytes
  script_json     jsonb,                  -- the diff/script as JSON (lightweight alt)
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

-- ─── Scripts ───────────────────────────────────────────────────
-- Discrete script files (share-able, community-visible)
create table public.scripts (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references public.projects(id) on delete set null,
  owner_id        uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  description     text,
  script_json     jsonb not null,         -- the map diff payload
  ecu_def         text,
  is_public       boolean not null default false,
  download_count  integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Row-Level Security ────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.projects         enable row level security;
alter table public.project_versions enable row level security;
alter table public.scripts          enable row level security;

-- Profiles: users can read their own, update their own
create policy "profiles: owner read"    on public.profiles for select using (auth.uid() = id);
create policy "profiles: owner update"  on public.profiles for update using (auth.uid() = id);

-- Projects: owner can CRUD; others can read public ones
create policy "projects: owner all"     on public.projects for all    using (auth.uid() = owner_id);
create policy "projects: public read"   on public.projects for select using (is_public = true);

-- Versions: scoped to project owner only
create policy "versions: owner all"     on public.project_versions for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

-- Scripts: owner all, public visible to all authenticated
create policy "scripts: owner all"      on public.scripts for all    using (auth.uid() = owner_id);
create policy "scripts: public read"    on public.scripts for select using (is_public = true);

-- ─── Updated-At Triggers ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

create trigger set_scripts_updated_at
  before update on public.scripts
  for each row execute procedure public.set_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
