-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- One row per thumbs up / thumbs down on a scan result.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  rating text not null check (rating in ('up', 'down')),
  comment text,
  profile jsonb not null,     -- the allergies the person selected
  result jsonb not null,      -- what the scanner showed them
  photo_path text             -- file in the feedback-photos bucket, if they chose to share it
);

-- Row level security with no policies: nobody can read or write this table
-- with the public key. Only the app's server (using the secret key) can.
alter table public.feedback enable row level security;

-- Private bucket for photos people opt in to sharing.
insert into storage.buckets (id, name, public)
values ('feedback-photos', 'feedback-photos', false)
on conflict (id) do nothing;
