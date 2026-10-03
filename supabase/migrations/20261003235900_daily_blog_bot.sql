-- Daily editorial bot. One row per local publish slot.
-- The service worker inserts rows. Staff can read the plan. Anonymous users cannot.

create table if not exists public.editorial_slots (
  id uuid primary key default gen_random_uuid(),
  slot_on date not null,
  slot_time text not null,
  timezone text not null default 'Asia/Jakarta',
  run_at timestamptz not null,
  status text not null default 'planning',
  attempts integer not null default 0,
  next_attempt_at timestamptz,
  error text,
  batch_id uuid references public.generation_batches (id) on delete set null,
  job_id uuid references public.generation_jobs (id) on delete set null,
  post_id uuid references public.blog_posts (id) on delete set null,
  tool_slug text,
  article_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editorial_slots_time_check check (slot_time ~ '^\d{2}:\d{2}$'),
  constraint editorial_slots_timezone_check check (char_length(timezone) between 3 and 64),
  constraint editorial_slots_status_check check (status in ('planning', 'queued', 'held', 'scheduled', 'failed')),
  constraint editorial_slots_attempts_check check (attempts >= 0 and attempts <= 8),
  constraint editorial_slots_unique unique (slot_on, slot_time, timezone)
);

create index if not exists editorial_slots_run_at_idx on public.editorial_slots (run_at);
create index if not exists editorial_slots_batch_id_idx on public.editorial_slots (batch_id);
create index if not exists editorial_slots_job_id_idx on public.editorial_slots (job_id);
create index if not exists editorial_slots_post_id_idx on public.editorial_slots (post_id);

drop trigger if exists editorial_slots_set_updated_at on public.editorial_slots;
create trigger editorial_slots_set_updated_at
  before update on public.editorial_slots
  for each row execute function app.set_updated_at();

alter table public.editorial_slots enable row level security;
alter table public.editorial_slots force row level security;

drop policy if exists editorial_slots_select on public.editorial_slots;
create policy editorial_slots_select
  on public.editorial_slots for select to authenticated
  using ((select app.is_staff()));

revoke all on table public.editorial_slots from public, anon, authenticated;
grant select on table public.editorial_slots to authenticated;
grant select, insert, update on table public.editorial_slots to service_role;

insert into public.site_settings (key, value, is_public)
values
  ('daily_blog_enabled', 'true'::jsonb, false),
  ('daily_publish_count', '4'::jsonb, false),
  ('daily_publish_times', '["08:00","12:00","16:00","20:00"]'::jsonb, false),
  ('daily_blog_timezone', '"Asia/Jakarta"'::jsonb, false)
on conflict (key) do nothing;
