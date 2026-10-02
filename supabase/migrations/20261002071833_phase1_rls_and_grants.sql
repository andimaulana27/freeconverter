alter table public.admin_profiles enable row level security;
alter table public.blog_topics enable row level security;
alter table public.media_assets enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_post_revisions enable row level security;
alter table public.blog_tags enable row level security;
alter table public.blog_post_tags enable row level security;
alter table public.publishing_schedules enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.ai_model_profiles enable row level security;
alter table public.generation_batches enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.integration_secret_refs enable row level security;
alter table public.ad_creatives enable row level security;
alter table public.ad_placements enable row level security;
alter table public.ad_assignments enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

alter table public.admin_profiles force row level security;
alter table public.blog_topics force row level security;
alter table public.media_assets force row level security;
alter table public.blog_posts force row level security;
alter table public.blog_post_revisions force row level security;
alter table public.blog_tags force row level security;
alter table public.blog_post_tags force row level security;
alter table public.publishing_schedules force row level security;
alter table public.prompt_templates force row level security;
alter table public.ai_model_profiles force row level security;
alter table public.generation_batches force row level security;
alter table public.generation_jobs force row level security;
alter table public.integration_secret_refs force row level security;
alter table public.ad_creatives force row level security;
alter table public.ad_placements force row level security;
alter table public.ad_assignments force row level security;
alter table public.site_settings force row level security;
alter table public.audit_logs force row level security;

create policy admin_profiles_select
  on public.admin_profiles for select to authenticated
  using ((select app.is_staff()) or user_id = (select app.uid()));

create policy admin_profiles_update_self
  on public.admin_profiles for update to authenticated
  using (user_id = (select app.uid()))
  with check (user_id = (select app.uid()));

create policy blog_topics_public_select
  on public.blog_topics for select to anon, authenticated
  using (is_public or (select app.is_cms_reader()));

create policy blog_topics_write
  on public.blog_topics for all to authenticated
  using ((select app.is_cms_publisher()))
  with check ((select app.is_cms_publisher()));

create policy media_assets_public_select
  on public.media_assets for select to anon, authenticated
  using (visibility = 'public' or (select app.is_staff()));

create policy media_assets_insert
  on public.media_assets for insert to authenticated
  with check (
    owner_id = (select app.uid())
    and (
      ((select app.is_cms_reader()) and bucket in ('blog-public', 'blog-private'))
      or ((select app.is_ad_manager()) and bucket = 'ad-creatives')
    )
  );

create policy media_assets_update
  on public.media_assets for update to authenticated
  using (
    ((select app.is_cms_publisher()) and bucket in ('blog-public', 'blog-private'))
    or ((select app.is_ad_manager()) and bucket = 'ad-creatives')
    or (owner_id = (select app.uid()) and (select app.is_cms_reader()))
  )
  with check (
    ((select app.is_cms_publisher()) and bucket in ('blog-public', 'blog-private'))
    or ((select app.is_ad_manager()) and bucket = 'ad-creatives')
    or (owner_id = (select app.uid()) and (select app.is_cms_reader()))
  );

create policy media_assets_delete
  on public.media_assets for delete to authenticated
  using (
    (select app.is_cms_publisher())
    or (select app.is_ad_manager())
    or (owner_id = (select app.uid()) and (select app.is_cms_reader()))
  );

create policy blog_posts_public_select
  on public.blog_posts for select to anon, authenticated
  using (
    (select app.post_is_publicly_visible(status, published_at, unpublished_at))
    or (select app.is_cms_publisher())
    or ((select app.has_role(array['author']::text[])) and author_id = (select app.uid()))
  );

create policy blog_posts_insert
  on public.blog_posts for insert to authenticated
  with check (
    (select app.is_cms_publisher())
    or (
      (select app.has_role(array['author']::text[]))
      and author_id = (select app.uid())
      and created_by = (select app.uid())
      and status in ('draft', 'review')
    )
  );

create policy blog_posts_update_publisher
  on public.blog_posts for update to authenticated
  using ((select app.is_cms_publisher()))
  with check ((select app.is_cms_publisher()));

create policy blog_posts_update_author
  on public.blog_posts for update to authenticated
  using (
    (select app.has_role(array['author']::text[]))
    and author_id = (select app.uid())
    and status in ('draft', 'review')
  )
  with check (
    (select app.has_role(array['author']::text[]))
    and author_id = (select app.uid())
    and status in ('draft', 'review')
  );

create policy blog_posts_delete_publisher
  on public.blog_posts for delete to authenticated
  using ((select app.is_cms_publisher()));

create policy blog_posts_delete_author
  on public.blog_posts for delete to authenticated
  using (
    (select app.has_role(array['author']::text[]))
    and author_id = (select app.uid())
    and status in ('draft', 'review')
  );

create policy blog_post_revisions_select
  on public.blog_post_revisions for select to authenticated
  using ((select app.can_read_post(post_id)) and (select app.is_cms_reader()));

create policy blog_post_revisions_insert
  on public.blog_post_revisions for insert to authenticated
  with check ((select app.can_write_post(post_id)));

create policy blog_tags_public_select
  on public.blog_tags for select to anon, authenticated
  using (true);

create policy blog_tags_write
  on public.blog_tags for all to authenticated
  using ((select app.is_cms_publisher()))
  with check ((select app.is_cms_publisher()));

create policy blog_post_tags_select
  on public.blog_post_tags for select to anon, authenticated
  using ((select app.can_read_post(post_id)));

create policy blog_post_tags_write
  on public.blog_post_tags for all to authenticated
  using ((select app.can_write_post(post_id)))
  with check ((select app.can_write_post(post_id)));

create policy publishing_schedules_select
  on public.publishing_schedules for select to authenticated
  using ((select app.is_cms_publisher()));

create policy publishing_schedules_write
  on public.publishing_schedules for all to authenticated
  using ((select app.is_cms_publisher()))
  with check ((select app.is_cms_publisher()));

create policy prompt_templates_select
  on public.prompt_templates for select to authenticated
  using ((select app.is_cms_reader()));

create policy prompt_templates_write
  on public.prompt_templates for all to authenticated
  using ((select app.is_super_admin()))
  with check ((select app.is_super_admin()));

create policy ai_model_profiles_select
  on public.ai_model_profiles for select to authenticated
  using ((select app.is_cms_reader()));

create policy ai_model_profiles_write
  on public.ai_model_profiles for all to authenticated
  using ((select app.is_super_admin()))
  with check ((select app.is_super_admin()));

create policy generation_batches_select
  on public.generation_batches for select to authenticated
  using ((select app.can_access_batch(id)));

create policy generation_batches_insert
  on public.generation_batches for insert to authenticated
  with check (
    (
      (select app.is_cms_reader())
      and created_by = (select app.uid())
      and publishing_mode = 'draft'
    )
    or (select app.is_cms_publisher())
  );

create policy generation_batches_update
  on public.generation_batches for update to authenticated
  using ((select app.can_access_batch(id)))
  with check ((select app.can_access_batch(id)));

create policy generation_jobs_select
  on public.generation_jobs for select to authenticated
  using ((select app.can_access_batch(batch_id)));

create policy generation_jobs_insert
  on public.generation_jobs for insert to authenticated
  with check ((select app.can_access_batch(batch_id)));

create policy generation_jobs_update
  on public.generation_jobs for update to authenticated
  using ((select app.can_access_batch(batch_id)))
  with check ((select app.can_access_batch(batch_id)));

create policy integration_secret_refs_all
  on public.integration_secret_refs for all to authenticated
  using ((select app.is_super_admin()))
  with check ((select app.is_super_admin()));

create policy ad_creatives_public_select
  on public.ad_creatives for select to anon, authenticated
  using (
    (select app.ad_is_publicly_active(status, starts_at, ends_at))
    or (select app.is_ad_manager())
    or (select app.is_cms_publisher())
  );

create policy ad_creatives_write
  on public.ad_creatives for all to authenticated
  using ((select app.is_ad_manager()))
  with check ((select app.is_ad_manager()));

create policy ad_placements_public_select
  on public.ad_placements for select to anon, authenticated
  using (true);

create policy ad_placements_write
  on public.ad_placements for all to authenticated
  using ((select app.is_super_admin()))
  with check ((select app.is_super_admin()));

create policy ad_assignments_public_select
  on public.ad_assignments for select to anon, authenticated
  using (
    (
      is_active
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
    )
    or (select app.is_ad_manager())
    or (select app.is_cms_publisher())
  );

create policy ad_assignments_write
  on public.ad_assignments for all to authenticated
  using ((select app.is_ad_manager()))
  with check ((select app.is_ad_manager()));

create policy site_settings_select
  on public.site_settings for select to anon, authenticated
  using (is_public or (select app.is_staff()));

create policy site_settings_write
  on public.site_settings for all to authenticated
  using ((select app.is_super_admin()))
  with check ((select app.is_super_admin()));

create policy audit_logs_select
  on public.audit_logs for select to authenticated
  using ((select app.is_super_admin()) or (select app.has_role(array['editor']::text[])));

create policy audit_logs_insert
  on public.audit_logs for insert to authenticated
  with check ((select app.is_staff()) and actor_id = (select app.uid()));

revoke all on table public.admin_profiles from public, anon, authenticated;
revoke all on table public.blog_topics from public, anon, authenticated;
revoke all on table public.media_assets from public, anon, authenticated;
revoke all on table public.blog_posts from public, anon, authenticated;
revoke all on table public.blog_post_revisions from public, anon, authenticated;
revoke all on table public.blog_tags from public, anon, authenticated;
revoke all on table public.blog_post_tags from public, anon, authenticated;
revoke all on table public.publishing_schedules from public, anon, authenticated;
revoke all on table public.prompt_templates from public, anon, authenticated;
revoke all on table public.ai_model_profiles from public, anon, authenticated;
revoke all on table public.generation_batches from public, anon, authenticated;
revoke all on table public.generation_jobs from public, anon, authenticated;
revoke all on table public.integration_secret_refs from public, anon, authenticated;
revoke all on table public.ad_creatives from public, anon, authenticated;
revoke all on table public.ad_placements from public, anon, authenticated;
revoke all on table public.ad_assignments from public, anon, authenticated;
revoke all on table public.site_settings from public, anon, authenticated;
revoke all on table public.audit_logs from public, anon, authenticated;

grant select, update (display_name) on table public.admin_profiles to authenticated;
grant select on table public.blog_topics to anon, authenticated;
grant insert, update, delete on table public.blog_topics to authenticated;
grant select on table public.media_assets to anon, authenticated;
grant insert, update, delete on table public.media_assets to authenticated;
grant select on table public.blog_posts to anon, authenticated;
grant insert, update, delete on table public.blog_posts to authenticated;
grant select, insert on table public.blog_post_revisions to authenticated;
grant select on table public.blog_tags to anon, authenticated;
grant insert, update, delete on table public.blog_tags to authenticated;
grant select on table public.blog_post_tags to anon, authenticated;
grant insert, delete on table public.blog_post_tags to authenticated;
grant select, insert, update, delete on table public.publishing_schedules to authenticated;
grant select on table public.prompt_templates to authenticated;
grant insert, update, delete on table public.prompt_templates to authenticated;
grant select on table public.ai_model_profiles to authenticated;
grant insert, update, delete on table public.ai_model_profiles to authenticated;
grant select, insert, update on table public.generation_batches to authenticated;
grant select, insert, update on table public.generation_jobs to authenticated;
grant select, insert, update, delete on table public.integration_secret_refs to authenticated;
grant select on table public.ad_creatives to anon, authenticated;
grant insert, update, delete on table public.ad_creatives to authenticated;
grant select on table public.ad_placements to anon, authenticated;
grant insert, update, delete on table public.ad_placements to authenticated;
grant select on table public.ad_assignments to anon, authenticated;
grant insert, update, delete on table public.ad_assignments to authenticated;
grant select on table public.site_settings to anon, authenticated;
grant insert, update, delete on table public.site_settings to authenticated;
grant select, insert on table public.audit_logs to authenticated;
