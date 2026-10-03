-- Phase 6 durable batch generation: independent article jobs, media jobs, retries, cancellation.
-- Additive only. Claim logic lives in private schema app; public RPC wrappers are service-role only.

alter table public.generation_jobs
  add column if not exists cancel_requested boolean not null default false,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists locked_at timestamptz,
  add column if not exists worker_id text,
  add column if not exists cost_estimate_usd numeric;

alter table public.generation_jobs
  drop constraint if exists generation_jobs_max_attempts_check;

alter table public.generation_jobs
  add constraint generation_jobs_max_attempts_check check (max_attempts >= 1 and max_attempts <= 8);

alter table public.generation_batches
  add column if not exists cancel_requested boolean not null default false;

create table if not exists public.generation_media_jobs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.generation_batches (id) on delete cascade,
  generation_job_id uuid references public.generation_jobs (id) on delete set null,
  post_id uuid references public.blog_posts (id) on delete set null,
  media_asset_id uuid references public.media_assets (id) on delete set null,
  kind text not null default 'cover_illustration',
  status public.generation_job_status not null default 'pending',
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  error text,
  token_usage jsonb not null default '{}'::jsonb,
  idempotency_key text,
  heartbeat_at timestamptz,
  next_attempt_at timestamptz,
  cancel_requested boolean not null default false,
  locked_at timestamptz,
  worker_id text,
  prompt_hash text,
  seed text,
  payload jsonb not null default '{}'::jsonb,
  moderation jsonb not null default '{}'::jsonb,
  cost_estimate_usd numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generation_media_jobs_attempts_check check (attempts >= 0),
  constraint generation_media_jobs_max_attempts_check check (max_attempts >= 1 and max_attempts <= 8),
  constraint generation_media_jobs_kind_check check (kind in ('cover_illustration'))
);

create unique index if not exists generation_media_jobs_idempotency_key_idx
  on public.generation_media_jobs (idempotency_key)
  where idempotency_key is not null;

create index if not exists generation_jobs_claim_idx
  on public.generation_jobs (status, next_attempt_at, created_at)
  where status in ('pending', 'running');

create index if not exists generation_media_jobs_claim_idx
  on public.generation_media_jobs (status, next_attempt_at, created_at)
  where status in ('pending', 'running');

create index if not exists generation_media_jobs_batch_id_idx
  on public.generation_media_jobs (batch_id);

create index if not exists generation_media_jobs_post_id_idx
  on public.generation_media_jobs (post_id);

create index if not exists generation_media_jobs_generation_job_id_idx
  on public.generation_media_jobs (generation_job_id);

create index if not exists generation_media_jobs_media_asset_id_idx
  on public.generation_media_jobs (media_asset_id);

drop trigger if exists generation_media_jobs_set_updated_at on public.generation_media_jobs;
create trigger generation_media_jobs_set_updated_at
  before update on public.generation_media_jobs
  for each row execute function app.set_updated_at();

alter table public.generation_media_jobs enable row level security;
alter table public.generation_media_jobs force row level security;

drop policy if exists generation_media_jobs_select on public.generation_media_jobs;
drop policy if exists generation_media_jobs_insert on public.generation_media_jobs;
drop policy if exists generation_media_jobs_update on public.generation_media_jobs;

create policy generation_media_jobs_select
  on public.generation_media_jobs for select to authenticated
  using ((select app.can_access_batch(batch_id)));

create policy generation_media_jobs_insert
  on public.generation_media_jobs for insert to authenticated
  with check ((select app.can_access_batch(batch_id)));

create policy generation_media_jobs_update
  on public.generation_media_jobs for update to authenticated
  using ((select app.can_access_batch(batch_id)))
  with check ((select app.can_access_batch(batch_id)));

revoke all on table public.generation_media_jobs from public, anon, authenticated;
grant select, insert, update on table public.generation_media_jobs to authenticated;

create or replace function app.claim_generation_jobs(p_limit integer, p_worker_id text, p_stale interval)
returns setof public.generation_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.generation_jobs j
  set
    status = case
      when j.cancel_requested then 'cancelled'::public.generation_job_status
      when j.attempts >= j.max_attempts then 'failed'::public.generation_job_status
      else 'pending'::public.generation_job_status
    end,
    error = case
      when j.cancel_requested then coalesce(j.error, 'Cancelled.')
      when j.attempts >= j.max_attempts then coalesce(j.error, 'Timed out after too many attempts.')
      else coalesce(j.error, 'Recovered after a stale worker heartbeat.')
    end,
    next_attempt_at = case
      when j.cancel_requested or j.attempts >= j.max_attempts then j.next_attempt_at
      else now()
    end,
    locked_at = null,
    worker_id = null
  where j.status = 'running'
    and j.heartbeat_at is not null
    and j.heartbeat_at < now() - p_stale;

  return query
  with picked as materialized (
    select j.id
    from public.generation_jobs j
    join public.generation_batches b on b.id = j.batch_id
    where j.status = 'pending'
      and j.cancel_requested = false
      and b.cancel_requested = false
      and b.status in ('pending', 'running')
      and (j.next_attempt_at is null or j.next_attempt_at <= now())
      and j.attempts < j.max_attempts
    order by j.created_at
    for update of j skip locked
    limit greatest(1, least(coalesce(p_limit, 1), 4))
  )
  update public.generation_jobs j
  set
    status = 'running',
    stage = case when j.stage = 'queued' then 'brief'::public.generation_job_stage else j.stage end,
    attempts = j.attempts + 1,
    heartbeat_at = now(),
    locked_at = now(),
    worker_id = p_worker_id,
    error = null
  from picked
  where j.id = picked.id
  returning j.*;
end;
$$;

create or replace function app.claim_generation_media_jobs(p_limit integer, p_worker_id text, p_stale interval)
returns setof public.generation_media_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.generation_media_jobs j
  set
    status = case
      when j.cancel_requested then 'cancelled'::public.generation_job_status
      when j.attempts >= j.max_attempts then 'failed'::public.generation_job_status
      else 'pending'::public.generation_job_status
    end,
    error = case
      when j.cancel_requested then coalesce(j.error, 'Cancelled.')
      when j.attempts >= j.max_attempts then coalesce(j.error, 'Timed out after too many attempts.')
      else coalesce(j.error, 'Recovered after a stale worker heartbeat.')
    end,
    next_attempt_at = case
      when j.cancel_requested or j.attempts >= j.max_attempts then j.next_attempt_at
      else now()
    end,
    locked_at = null,
    worker_id = null
  where j.status = 'running'
    and j.heartbeat_at is not null
    and j.heartbeat_at < now() - p_stale;

  return query
  with picked as materialized (
    select j.id
    from public.generation_media_jobs j
    join public.generation_batches b on b.id = j.batch_id
    where j.status = 'pending'
      and j.cancel_requested = false
      and b.cancel_requested = false
      and (j.next_attempt_at is null or j.next_attempt_at <= now())
      and j.attempts < j.max_attempts
    order by j.created_at
    for update of j skip locked
    limit greatest(1, least(coalesce(p_limit, 1), 4))
  )
  update public.generation_media_jobs j
  set
    status = 'running',
    attempts = j.attempts + 1,
    heartbeat_at = now(),
    locked_at = now(),
    worker_id = p_worker_id,
    error = null
  from picked
  where j.id = picked.id
  returning j.*;
end;
$$;

create or replace function public.claim_generation_jobs(p_limit integer, p_worker_id text, p_stale_seconds integer)
returns setof public.generation_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed';
  end if;
  return query
  select *
  from app.claim_generation_jobs(
    p_limit,
    p_worker_id,
    make_interval(secs => greatest(30, least(coalesce(p_stale_seconds, 300), 900)))
  );
end;
$$;

create or replace function public.claim_generation_media_jobs(p_limit integer, p_worker_id text, p_stale_seconds integer)
returns setof public.generation_media_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed';
  end if;
  return query
  select *
  from app.claim_generation_media_jobs(
    p_limit,
    p_worker_id,
    make_interval(secs => greatest(30, least(coalesce(p_stale_seconds, 300), 900)))
  );
end;
$$;

revoke all on function app.claim_generation_jobs(integer, text, interval) from public, anon, authenticated;
revoke all on function app.claim_generation_media_jobs(integer, text, interval) from public, anon, authenticated;
revoke all on function public.claim_generation_jobs(integer, text, integer) from public, anon, authenticated;
revoke all on function public.claim_generation_media_jobs(integer, text, integer) from public, anon, authenticated;

grant usage on schema app to service_role;
grant execute on function app.claim_generation_jobs(integer, text, interval) to service_role;
grant execute on function app.claim_generation_media_jobs(integer, text, interval) to service_role;
grant execute on function public.claim_generation_jobs(integer, text, integer) to service_role;
grant execute on function public.claim_generation_media_jobs(integer, text, integer) to service_role;

insert into public.site_settings (key, value, is_public)
values
  ('generation_max_attempts', '3'::jsonb, false),
  ('generation_concurrency', '2'::jsonb, false),
  ('generation_media_concurrency', '2'::jsonb, false),
  ('generation_stale_seconds', '300'::jsonb, false),
  ('auto_publish_enabled', 'false'::jsonb, false),
  ('generation_job_timeout_seconds', '240'::jsonb, false),
  ('auto_publish_stagger_minutes', '30'::jsonb, false)
on conflict (key) do nothing;

update public.site_settings
set value = '24'::jsonb
where key = 'generation_hourly_job_limit'
  and coalesce((value #>> '{}')::int, 0) < 24;
