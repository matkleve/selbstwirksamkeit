-- Multiple tags per entry (replaces single category column)
alter table entries add column if not exists categories text[] not null default array['allgemein']::text[];

update entries set categories = array[category]::text[] where category is not null;

alter table entries drop column if exists category;
