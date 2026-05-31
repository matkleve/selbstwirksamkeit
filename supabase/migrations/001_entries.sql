-- Run this in your Supabase SQL editor
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  category text not null default 'allgemein',
  created_at timestamptz default now() not null
);

-- Row Level Security: each user sees only their own entries
alter table entries enable row level security;

create policy "Users can read own entries"
  on entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on entries for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own entries"
  on entries for delete
  using (auth.uid() = user_id);
