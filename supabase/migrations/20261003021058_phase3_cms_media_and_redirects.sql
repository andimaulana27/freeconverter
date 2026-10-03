-- Phase 3 admin CMS: media provenance, post-media relations, and slug redirects.
-- Applied remotely as 20261003021058. Additive only; existing Phase 1 rows remain valid.
-- Review notes:
-- 1. Media approval is publisher-only via trigger, not just application code.
-- 2. Slug redirects are publicly readable so published URL changes 301.
-- 3. Write policies are split (insert/update/delete), not FOR ALL.
-- 4. SVG is allowed in blog buckets for deterministic branded covers.

create type public.media_source as enum ('upload', 'template', 'ai');
create type public.media_generation_status as enum ('idle', 'pending', 'ready', 'failed', 'rejected');
create type public.post_media_role as enum ('cover', 'inline', 'diagram', 'social');

alter table public.media_assets
  add column source public.media_source not null default 'upload',
  add column generation_status public.media_generation_status not null default 'idle',
  add column provider text,
  add column model_id text,
  add column prompt_hash text,
  add column seed text,
  add column focal_x numeric(5, 4) not null default 0.5,
  add column focal_y numeric(5, 4) not null default 0.5,
  add column variant text,
  add column template_key text,
  add column approved_at timestamptz,
  add column approved_by uuid references auth.users (id) on delete set null,
  add constraint media_assets_focal_x_check check (focal_x >= 0 and focal_x <= 1),
  add constraint media_assets_focal_y_check check (focal_y >= 0 and focal_y <= 1);

create table public.blog_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  media_asset_id uuid not null references public.media_assets (id) on delete cascade,
  role public.post_media_role not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint blog_post_media_sort_order_check check (sort_order >= 0),
  constraint blog_post_media_unique unique (post_id, media_asset_id, role)
);

create unique index blog_post_media_one_cover_idx
  on public.blog_post_media (post_id)
  where role = 'cover';

create unique index blog_post_media_one_social_idx
  on public.blog_post_media (post_id)
  where role = 'social';

create table public.blog_slug_redirects (
  id uuid primary key default gen_random_uuid(),
  from_slug text not null unique,
  to_slug text not null,
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint blog_slug_redirects_from_slug_check check (from_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_slug_redirects_to_slug_check check (to_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_slug_redirects_distinct check (from_slug <> to_slug)
);

create or replace function app.guard_media_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (new.approved_at is not null or new.approved_by is not null) and not app.is_cms_publisher() then
      raise exception 'Only publishers can approve media';
    end if;
    return new;
  end if;

  if (new.approved_at is distinct from old.approved_at or new.approved_by is distinct from old.approved_by)
     and not app.is_cms_publisher() then
    raise exception 'Only publishers can approve media';
  end if;

  return new;
end;
$$;

revoke all on function app.guard_media_approval() from public, anon, authenticated;

create trigger media_assets_guard_approval
  before insert or update on public.media_assets
  for each row execute function app.guard_media_approval();

alter table public.blog_post_media enable row level security;
alter table public.blog_post_media force row level security;
alter table public.blog_slug_redirects enable row level security;
alter table public.blog_slug_redirects force row level security;

create policy blog_post_media_select
  on public.blog_post_media for select to anon, authenticated
  using ((select app.can_read_post(post_id)));

create policy blog_post_media_insert
  on public.blog_post_media for insert to authenticated
  with check ((select app.can_write_post(post_id)));

create policy blog_post_media_update
  on public.blog_post_media for update to authenticated
  using ((select app.can_write_post(post_id)))
  with check ((select app.can_write_post(post_id)));

create policy blog_post_media_delete
  on public.blog_post_media for delete to authenticated
  using ((select app.can_write_post(post_id)));

create policy blog_slug_redirects_public_select
  on public.blog_slug_redirects for select to anon, authenticated
  using (true);

create policy blog_slug_redirects_insert
  on public.blog_slug_redirects for insert to authenticated
  with check ((select app.is_cms_publisher()));

create policy blog_slug_redirects_update
  on public.blog_slug_redirects for update to authenticated
  using ((select app.is_cms_publisher()))
  with check ((select app.is_cms_publisher()));

create policy blog_slug_redirects_delete
  on public.blog_slug_redirects for delete to authenticated
  using ((select app.is_cms_publisher()));

revoke all on table public.blog_post_media from public, anon, authenticated;
revoke all on table public.blog_slug_redirects from public, anon, authenticated;

grant select on table public.blog_post_media to anon, authenticated;
grant insert, update, delete on table public.blog_post_media to authenticated;
grant select on table public.blog_slug_redirects to anon, authenticated;
grant insert, update, delete on table public.blog_slug_redirects to authenticated;

create index blog_post_media_post_id_idx on public.blog_post_media (post_id);
create index blog_post_media_media_asset_id_idx on public.blog_post_media (media_asset_id);
create index blog_slug_redirects_post_id_idx on public.blog_slug_redirects (post_id);
create index blog_slug_redirects_to_slug_idx on public.blog_slug_redirects (to_slug);
create index media_assets_approved_by_idx on public.media_assets (approved_by);
create index media_assets_source_idx on public.media_assets (source);

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml']
where id = 'blog-public';

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml', 'application/pdf'
]
where id = 'blog-private';

insert into public.blog_topics (slug, name, description, seo_title, seo_description, is_public)
values
  (
    'how-to',
    'How-to guides',
    'Step-by-step tutorials for AllYouConvert tools.',
    'How-to file conversion guides',
    'Practical tutorials that walk through converting and editing files in the browser.',
    true
  ),
  (
    'comparisons',
    'Format comparisons',
    'Clear tradeoffs that help users choose an output format.',
    'File format comparisons',
    'Compare common file formats and choose the right output for the job.',
    true
  ),
  (
    'troubleshooting',
    'Troubleshooting',
    'Fixes for upload, quality, and compatibility problems.',
    'File conversion troubleshooting',
    'Solve common conversion, quality, and compatibility issues.',
    true
  ),
  (
    'workflows',
    'Workflows',
    'Multi-step file tasks across documents, images, and PDFs.',
    'File workflow guides',
    'Useful multi-step workflows for documents, images, and PDFs.',
    true
  ),
  (
    'privacy',
    'Privacy',
    'How browser processing and file handling work on AllYouConvert.',
    'Privacy and browser processing',
    'Understand how AllYouConvert processes files and what stays in the browser.',
    true
  ),
  (
    'glossary',
    'Glossary',
    'Evergreen format and compatibility references.',
    'File format glossary',
    'Short references for common file formats and compatibility terms.',
    true
  )
on conflict (slug) do nothing;
