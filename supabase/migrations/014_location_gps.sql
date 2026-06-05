-- GPS capture alongside user-facing location chip
alter table entries
  add column if not exists location_gps text,
  add column if not exists location_resolved text;
