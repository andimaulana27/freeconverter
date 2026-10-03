-- Phase 7 editorial quality and privacy-safe growth metrics.
-- Additive only. Public metric writes go through the Next.js API with the service role.

create table if not exists public.content_quality_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  score integer not null default 0,
  blocking_count integer not null default 0,
  warning_count integer not null default 0,
  findings jsonb not null default '{}'::jsonb,
  editorial jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint content_quality_reports_score_check check (score >= 0 and score <= 100)
);

create index if not exists content_quality_reports_post_id_idx
  on public.content_quality_reports (post_id, created_at desc);

create table if not exists public.content_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null default (timezone('utc', now()))::date,
  path text not null,
  metric_key text not null,
  value integer not null default 0,
  source text not null default 'product',
  updated_at timestamptz not null default now(),
  constraint content_metrics_daily_path_check check (
    char_length(path) between 2 and 180
    and path like '/%'
    and path not like '//%'
    and path not like '/admin%'
  ),
  constraint content_metrics_daily_key_check check (
    metric_key in ('gsc_impressions', 'gsc_clicks', 'guide_view', 'tool_start', 'guide_tool_click')
  ),
  constraint content_metrics_daily_source_check check (source in ('product', 'gsc', 'manual')),
  constraint content_metrics_daily_value_check check (value >= 0)
);

create unique index if not exists content_metrics_daily_unique_idx
  on public.content_metrics_daily (metric_date, path, metric_key);

create index if not exists content_metrics_daily_date_idx
  on public.content_metrics_daily (metric_date desc);

create table if not exists public.operational_alerts (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  severity text not null default 'warning',
  entity_type text,
  entity_id uuid,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint operational_alerts_kind_check check (
    kind in ('publish_failure', 'ad_failure', 'quality_hold', 'schedule_failure')
  ),
  constraint operational_alerts_severity_check check (severity in ('info', 'warning', 'error'))
);

create index if not exists operational_alerts_open_idx
  on public.operational_alerts (created_at desc)
  where resolved_at is null;

drop trigger if exists content_metrics_daily_set_updated_at on public.content_metrics_daily;
create trigger content_metrics_daily_set_updated_at
  before update on public.content_metrics_daily
  for each row execute function app.set_updated_at();

alter table public.content_quality_reports enable row level security;
alter table public.content_quality_reports force row level security;
alter table public.content_metrics_daily enable row level security;
alter table public.content_metrics_daily force row level security;
alter table public.operational_alerts enable row level security;
alter table public.operational_alerts force row level security;

drop policy if exists content_quality_reports_select on public.content_quality_reports;
drop policy if exists content_quality_reports_insert on public.content_quality_reports;
create policy content_quality_reports_select
  on public.content_quality_reports for select to authenticated
  using ((select app.is_cms_reader()));
create policy content_quality_reports_insert
  on public.content_quality_reports for insert to authenticated
  with check ((select app.is_cms_reader()));

drop policy if exists content_metrics_daily_select on public.content_metrics_daily;
drop policy if exists content_metrics_daily_write on public.content_metrics_daily;
create policy content_metrics_daily_select
  on public.content_metrics_daily for select to authenticated
  using ((select app.is_staff()));
create policy content_metrics_daily_insert
  on public.content_metrics_daily for insert to authenticated
  with check ((select app.is_super_admin()));
create policy content_metrics_daily_update
  on public.content_metrics_daily for update to authenticated
  using ((select app.is_super_admin()))
  with check ((select app.is_super_admin()));

drop policy if exists operational_alerts_select on public.operational_alerts;
drop policy if exists operational_alerts_insert on public.operational_alerts;
drop policy if exists operational_alerts_update on public.operational_alerts;
create policy operational_alerts_select
  on public.operational_alerts for select to authenticated
  using ((select app.is_staff()));
create policy operational_alerts_insert
  on public.operational_alerts for insert to authenticated
  with check ((select app.is_staff()));
create policy operational_alerts_update
  on public.operational_alerts for update to authenticated
  using ((select app.is_cms_publisher()) or (select app.is_super_admin()))
  with check ((select app.is_cms_publisher()) or (select app.is_super_admin()));

revoke all on table public.content_quality_reports from public, anon, authenticated;
revoke all on table public.content_metrics_daily from public, anon, authenticated;
revoke all on table public.operational_alerts from public, anon, authenticated;

grant select, insert on table public.content_quality_reports to authenticated;
grant select on table public.content_metrics_daily to authenticated;
grant insert, update on table public.content_metrics_daily to authenticated;
grant select, insert, update on table public.operational_alerts to authenticated;

insert into public.site_settings (key, value, is_public)
values
  ('quality_similarity_threshold', '0.42'::jsonb, false),
  ('growth_metrics_enabled', 'true'::jsonb, false)
on conflict (key) do nothing;
