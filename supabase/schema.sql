-- Bulletin-board notes. Run this in the Supabase SQL editor.
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'anonymous' check (char_length(name) between 1 and 24),
  topic       text not null default 'hello'     check (topic in ('project idea', 'about the wall', 'hello')),
  message     text not null                     check (char_length(message) between 1 and 140),
  hidden      boolean not null default false,   -- flip to true in the dashboard to moderate a note
  created_at  timestamptz not null default now()
);

alter table public.notes enable row level security;

-- Anyone may read visible notes…
create policy "read visible notes" on public.notes
  for select using (hidden = false);

-- …and post new ones (they can't edit or delete).
create policy "anyone can post" on public.notes
  for insert with check (hidden = false);
