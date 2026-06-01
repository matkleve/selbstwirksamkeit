alter table entries
  add column if not exists grid_x      numeric(3,1)
                                       check (grid_x >= -5 and grid_x <= 5),
  add column if not exists grid_y      numeric(3,1)
                                       check (grid_y >= -5 and grid_y <= 5),
  add column if not exists reframe     text,
  add column if not exists person      text,
  add column if not exists location    text,
  add column if not exists activity    text,
  add column if not exists body_state  text
                                       check (body_state in ('stressed', 'calm', 'tired') or body_state is null);

create policy "Users can update own entries"
  on entries for update
  using (auth.uid() = user_id);
