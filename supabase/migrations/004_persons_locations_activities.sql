-- Separate tables for persons, locations, and activities
-- These let us store per-user entity lists for autocomplete and future enrichment

create table if not exists persons (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
alter table persons enable row level security;
create policy "Users can manage own persons"
  on persons for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists locations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
alter table locations enable row level security;
create policy "Users can manage own locations"
  on locations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists activities (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
alter table activities enable row level security;
create policy "Users can manage own activities"
  on activities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
