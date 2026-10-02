-- Phase 1 secure foundation
-- Review notes (applied only after schema + RLS review):
-- 1. Authorization reads auth.jwt() -> app_metadata.role, never user_metadata.
-- 2. Helper functions live in private schema app (not exposed via Data API).
-- 3. RLS wraps helpers in SELECT so auth functions are evaluated once per query.
-- 4. Public reads require published + publication window. Drafts stay staff-only.
-- 5. Authors cannot publish, schedule, or mutate secrets.
-- 6. integration_secret_refs stores references and masked suffixes only.
-- 7. Ad tables store structured AdSense fields, never executable scripts.
-- 8. AI secrets stay in env for MVP (GOOGLE_GENERATIVE_AI_API_KEY); Vault later.
-- 9. MFA is enforced in admin middleware for enrolled users; restrictive table MFA
--    is deferred so public pages keep working for a signed-in editor.

create schema if not exists app;

comment on schema app is
  'Private RLS and trigger helpers. Do not expose this schema through the Data API.';

revoke all on schema app from public;
grant usage on schema app to anon, authenticated;

create or replace function app.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app.uid()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid();
$$;

create or replace function app.jwt_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '');
$$;

create or replace function app.has_role(allowed text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.jwt_role() = any(coalesce(allowed, array[]::text[]));
$$;

create or replace function app.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.jwt_role() = 'super_admin';
$$;

create or replace function app.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.jwt_role() = any(array['super_admin', 'editor', 'author', 'ad_manager']::text[]);
$$;

create or replace function app.is_cms_reader()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.jwt_role() = any(array['super_admin', 'editor', 'author']::text[]);
$$;

create or replace function app.is_cms_publisher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.jwt_role() = any(array['super_admin', 'editor']::text[]);
$$;

create or replace function app.is_ad_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.jwt_role() = any(array['super_admin', 'ad_manager']::text[]);
$$;

revoke all on function app.set_updated_at() from public, anon, authenticated;
revoke all on function app.uid() from public;
revoke all on function app.jwt_role() from public;
revoke all on function app.has_role(text[]) from public;
revoke all on function app.is_super_admin() from public;
revoke all on function app.is_staff() from public;
revoke all on function app.is_cms_reader() from public;
revoke all on function app.is_cms_publisher() from public;
revoke all on function app.is_ad_manager() from public;

grant execute on function app.uid() to anon, authenticated;
grant execute on function app.jwt_role() to anon, authenticated;
grant execute on function app.has_role(text[]) to anon, authenticated;
grant execute on function app.is_super_admin() to anon, authenticated;
grant execute on function app.is_staff() to anon, authenticated;
grant execute on function app.is_cms_reader() to anon, authenticated;
grant execute on function app.is_cms_publisher() to anon, authenticated;
grant execute on function app.is_ad_manager() to anon, authenticated;

create type public.blog_post_status as enum ('draft', 'review', 'scheduled', 'published', 'archived');
create type public.revision_source as enum ('editor', 'ai', 'restore', 'system');
create type public.media_visibility as enum ('public', 'private');
create type public.schedule_action as enum ('publish', 'unpublish');
create type public.schedule_status as enum ('pending', 'processed', 'failed', 'cancelled');
create type public.publishing_mode as enum ('draft', 'scheduled', 'auto');
create type public.generation_batch_status as enum ('pending', 'running', 'completed', 'partial', 'failed', 'cancelled');
create type public.generation_job_status as enum ('pending', 'running', 'completed', 'failed', 'cancelled');
create type public.generation_job_stage as enum ('queued', 'brief', 'outline', 'draft', 'seo', 'validation', 'review', 'saved');
create type public.ad_creative_type as enum ('adsense', 'image', 'empty');
create type public.ad_creative_status as enum ('draft', 'active', 'paused', 'archived');
create type public.ad_mobile_policy as enum ('hide', 'stack', 'swap');
create type public.secret_health as enum ('unknown', 'healthy', 'degraded', 'disabled');

create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_profiles_role_check
    check (role = '' or role in ('super_admin', 'editor', 'author', 'ad_manager'))
);

comment on table public.admin_profiles is
  'Display profile for Auth users. Role is a synced copy of app_metadata.role and is not client-writable.';

create table public.blog_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  seo_title text,
  seo_description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_topics_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  mime_type text,
  byte_size integer,
  width integer,
  height integer,
  alt_text text,
  visibility public.media_visibility not null default 'private',
  owner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_bucket_check check (bucket in ('blog-public', 'blog-private', 'ad-creatives')),
  constraint media_assets_path_check check (length(path) > 0),
  constraint media_assets_bucket_path_key unique (bucket, path)
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body jsonb not null default '{}'::jsonb,
  status public.blog_post_status not null default 'draft',
  seo_title text,
  seo_description text,
  canonical_path text,
  cover_asset_id uuid references public.media_assets (id) on delete set null,
  author_id uuid references public.admin_profiles (user_id) on delete set null,
  topic_id uuid references public.blog_topics (id) on delete set null,
  tool_slugs text[] not null default '{}'::text[],
  current_revision_id uuid,
  published_at timestamptz,
  unpublished_at timestamptz,
  scheduled_for timestamptz,
  noindex boolean not null default false,
  reading_minutes integer,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_posts_reading_minutes_check check (reading_minutes is null or reading_minutes >= 0)
);

create table public.blog_post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  snapshot jsonb not null,
  change_source public.revision_source not null default 'editor',
  editor_id uuid references auth.users (id) on delete set null,
  restored_from_id uuid references public.blog_post_revisions (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.blog_posts
  add constraint blog_posts_current_revision_id_fkey
  foreign key (current_revision_id) references public.blog_post_revisions (id) on delete set null;

create table public.blog_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  constraint blog_tags_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.blog_post_tags (
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  tag_id uuid not null references public.blog_tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create table public.publishing_schedules (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  action public.schedule_action not null,
  run_at timestamptz not null,
  status public.schedule_status not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint publishing_schedules_attempts_check check (attempts >= 0)
);

create table public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  version integer not null,
  system_prompt text not null,
  task_prompt text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prompt_templates_key_version_key unique (key, version),
  constraint prompt_templates_version_check check (version > 0)
);

create unique index prompt_templates_active_key_idx
  on public.prompt_templates (key)
  where is_active;

create table public.ai_model_profiles (
  id uuid primary key default gen_random_uuid(),
  task_key text not null unique,
  provider text not null default 'google',
  model_id text not null,
  prompt_template_id uuid references public.prompt_templates (id) on delete set null,
  temperature numeric,
  thinking_level text,
  max_output_tokens integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_model_profiles_temperature_check
    check (temperature is null or (temperature >= 0 and temperature <= 2)),
  constraint ai_model_profiles_max_output_tokens_check
    check (max_output_tokens is null or max_output_tokens > 0)
);

create table public.generation_batches (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  article_type text not null,
  requested_count integer not null,
  model_profile_id uuid references public.ai_model_profiles (id) on delete set null,
  publishing_mode public.publishing_mode not null default 'draft',
  status public.generation_batch_status not null default 'pending',
  progress jsonb not null default '{}'::jsonb,
  cost_estimate_usd numeric,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generation_batches_requested_count_check
    check (requested_count between 1 and 15),
  constraint generation_batches_article_type_check
    check (article_type in ('tool_tutorial', 'comparison', 'troubleshooting', 'workflow', 'privacy', 'glossary'))
);

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.generation_batches (id) on delete cascade,
  title text,
  outline jsonb,
  draft jsonb,
  validation jsonb,
  stage public.generation_job_stage not null default 'queued',
  status public.generation_job_status not null default 'pending',
  attempts integer not null default 0,
  error text,
  token_usage jsonb not null default '{}'::jsonb,
  post_id uuid references public.blog_posts (id) on delete set null,
  idempotency_key text,
  heartbeat_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generation_jobs_attempts_check check (attempts >= 0)
);

create unique index generation_jobs_idempotency_key_idx
  on public.generation_jobs (idempotency_key)
  where idempotency_key is not null;

create table public.integration_secret_refs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  secret_ref text not null,
  masked_suffix text not null,
  health_status public.secret_health not null default 'unknown',
  priority integer not null default 100,
  last_tested_at timestamptz,
  last_error text,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_secret_refs_priority_check check (priority >= 0),
  constraint integration_secret_refs_secret_ref_check check (secret_ref not like '%key%' or secret_ref like 'env:%' or secret_ref like 'vault:%')
);

comment on table public.integration_secret_refs is
  'Stores provider secret references and masked metadata only. Never store plaintext API keys.';

create table public.ad_creatives (
  id uuid primary key default gen_random_uuid(),
  type public.ad_creative_type not null,
  name text not null,
  width integer not null,
  height integer not null,
  google_client_id text,
  google_slot_id text,
  media_asset_id uuid references public.media_assets (id) on delete set null,
  target_url text,
  alt_text text,
  starts_at timestamptz,
  ends_at timestamptz,
  status public.ad_creative_status not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ad_creatives_dimensions_check check (width > 0 and height > 0),
  constraint ad_creatives_adsense_check
    check (type <> 'adsense' or google_slot_id is not null),
  constraint ad_creatives_image_check
    check (type <> 'image' or (media_asset_id is not null and target_url is not null and alt_text is not null))
);

create table public.ad_placements (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  page_scope text not null,
  desktop_width integer not null,
  desktop_height integer not null,
  mobile_width integer,
  mobile_height integer,
  mobile_policy public.ad_mobile_policy not null default 'hide',
  reserve_space boolean not null default true,
  fallback_behavior text not null default 'placeholder',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ad_placements_key_check check (key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  constraint ad_placements_page_scope_check
    check (page_scope in ('homepage', 'non_homepage', 'all', 'article')),
  constraint ad_placements_desktop_dimensions_check
    check (desktop_width > 0 and desktop_height > 0)
);

create table public.ad_assignments (
  id uuid primary key default gen_random_uuid(),
  creative_id uuid not null references public.ad_creatives (id) on delete cascade,
  placement_id uuid not null references public.ad_placements (id) on delete cascade,
  priority integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ad_assignments_creative_placement_key unique (creative_id, placement_id)
);

create table public.site_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  is_public boolean not null default false,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function app.post_is_publicly_visible(
  status public.blog_post_status,
  published_at timestamptz,
  unpublished_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    status = 'published'
    and published_at is not null
    and published_at <= now()
    and (unpublished_at is null or unpublished_at > now());
$$;

create or replace function app.can_read_post(target_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.blog_posts p
    where p.id = target_post_id
      and (
        app.post_is_publicly_visible(p.status, p.published_at, p.unpublished_at)
        or app.is_cms_publisher()
        or (app.has_role(array['author']::text[]) and p.author_id = auth.uid())
      )
  );
$$;

create or replace function app.can_write_post(target_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.blog_posts p
    where p.id = target_post_id
      and (
        app.is_cms_publisher()
        or (
          app.has_role(array['author']::text[])
          and p.author_id = auth.uid()
          and p.status in ('draft', 'review')
        )
      )
  );
$$;

create or replace function app.can_access_batch(target_batch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.generation_batches b
    where b.id = target_batch_id
      and (
        app.is_cms_publisher()
        or (app.has_role(array['author']::text[]) and b.created_by = auth.uid())
      )
  );
$$;

create or replace function app.ad_is_publicly_active(
  status public.ad_creative_status,
  starts_at timestamptz,
  ends_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    status = 'active'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now());
$$;

create or replace function app.handle_admin_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_role text;
  next_name text;
begin
  next_role := coalesce(new.raw_app_meta_data ->> 'role', '');
  if next_role not in ('super_admin', 'editor', 'author', 'ad_manager') then
    next_role := '';
  end if;

  next_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    split_part(coalesce(new.email, 'admin'), '@', 1)
  );

  insert into public.admin_profiles (user_id, display_name, role)
  values (new.id, next_name, next_role)
  on conflict (user_id) do update
    set role = excluded.role,
        is_active = true,
        updated_at = now();

  return new;
end;
$$;

revoke all on function app.post_is_publicly_visible(public.blog_post_status, timestamptz, timestamptz) from public;
revoke all on function app.can_read_post(uuid) from public;
revoke all on function app.can_write_post(uuid) from public;
revoke all on function app.can_access_batch(uuid) from public;
revoke all on function app.ad_is_publicly_active(public.ad_creative_status, timestamptz, timestamptz) from public;
revoke all on function app.handle_admin_profile() from public, anon, authenticated;

grant execute on function app.post_is_publicly_visible(public.blog_post_status, timestamptz, timestamptz) to anon, authenticated;
grant execute on function app.can_read_post(uuid) to anon, authenticated;
grant execute on function app.can_write_post(uuid) to authenticated;
grant execute on function app.can_access_batch(uuid) to authenticated;
grant execute on function app.ad_is_publicly_active(public.ad_creative_status, timestamptz, timestamptz) to anon, authenticated;

create trigger admin_profiles_set_updated_at
  before update on public.admin_profiles
  for each row execute function app.set_updated_at();

create trigger blog_topics_set_updated_at
  before update on public.blog_topics
  for each row execute function app.set_updated_at();

create trigger media_assets_set_updated_at
  before update on public.media_assets
  for each row execute function app.set_updated_at();

create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function app.set_updated_at();

create trigger publishing_schedules_set_updated_at
  before update on public.publishing_schedules
  for each row execute function app.set_updated_at();

create trigger prompt_templates_set_updated_at
  before update on public.prompt_templates
  for each row execute function app.set_updated_at();

create trigger ai_model_profiles_set_updated_at
  before update on public.ai_model_profiles
  for each row execute function app.set_updated_at();

create trigger generation_batches_set_updated_at
  before update on public.generation_batches
  for each row execute function app.set_updated_at();

create trigger generation_jobs_set_updated_at
  before update on public.generation_jobs
  for each row execute function app.set_updated_at();

create trigger integration_secret_refs_set_updated_at
  before update on public.integration_secret_refs
  for each row execute function app.set_updated_at();

create trigger ad_creatives_set_updated_at
  before update on public.ad_creatives
  for each row execute function app.set_updated_at();

create trigger ad_placements_set_updated_at
  before update on public.ad_placements
  for each row execute function app.set_updated_at();

create trigger ad_assignments_set_updated_at
  before update on public.ad_assignments
  for each row execute function app.set_updated_at();

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function app.set_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_admin_profile();

create trigger on_auth_user_app_metadata
  after update of raw_app_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data is distinct from new.raw_app_meta_data)
  execute function app.handle_admin_profile();

create index admin_profiles_role_idx on public.admin_profiles (role);
create index media_assets_owner_id_idx on public.media_assets (owner_id);
create index media_assets_visibility_idx on public.media_assets (visibility);
create index blog_posts_status_published_at_idx on public.blog_posts (status, published_at desc);
create index blog_posts_public_idx on public.blog_posts (published_at desc)
  where status = 'published';
create index blog_posts_author_id_idx on public.blog_posts (author_id);
create index blog_posts_topic_id_idx on public.blog_posts (topic_id);
create index blog_posts_cover_asset_id_idx on public.blog_posts (cover_asset_id);
create index blog_posts_current_revision_id_idx on public.blog_posts (current_revision_id);
create index blog_posts_created_by_idx on public.blog_posts (created_by);
create index blog_posts_updated_by_idx on public.blog_posts (updated_by);
create index blog_post_revisions_post_id_created_at_idx on public.blog_post_revisions (post_id, created_at desc);
create index blog_post_revisions_editor_id_idx on public.blog_post_revisions (editor_id);
create index blog_post_tags_tag_id_idx on public.blog_post_tags (tag_id);
create index publishing_schedules_post_id_idx on public.publishing_schedules (post_id);
create index publishing_schedules_pending_run_at_idx on public.publishing_schedules (run_at)
  where status = 'pending';
create index ai_model_profiles_prompt_template_id_idx on public.ai_model_profiles (prompt_template_id);
create index generation_batches_created_by_idx on public.generation_batches (created_by);
create index generation_batches_status_idx on public.generation_batches (status);
create index generation_jobs_batch_id_idx on public.generation_jobs (batch_id);
create index generation_jobs_status_idx on public.generation_jobs (status);
create index generation_jobs_post_id_idx on public.generation_jobs (post_id);
create index integration_secret_refs_provider_priority_idx
  on public.integration_secret_refs (provider, priority);
create index ad_creatives_status_idx on public.ad_creatives (status);
create index ad_creatives_media_asset_id_idx on public.ad_creatives (media_asset_id);
create index ad_assignments_placement_id_active_idx on public.ad_assignments (placement_id, is_active, priority desc);
create index ad_assignments_creative_id_idx on public.ad_assignments (creative_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
