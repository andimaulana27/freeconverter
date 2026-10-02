-- Advisor follow-up: index remaining FKs and stop FOR ALL write policies from
-- overlapping SELECT (multiple permissive policies warning).

create index ad_creatives_created_by_idx on public.ad_creatives (created_by);
create index blog_post_revisions_restored_from_id_idx on public.blog_post_revisions (restored_from_id);
create index generation_batches_model_profile_id_idx on public.generation_batches (model_profile_id);
create index integration_secret_refs_created_by_idx on public.integration_secret_refs (created_by);
create index publishing_schedules_created_by_idx on public.publishing_schedules (created_by);
create index site_settings_updated_by_idx on public.site_settings (updated_by);

drop policy if exists blog_topics_write on public.blog_topics;
create policy blog_topics_insert on public.blog_topics for insert to authenticated
  with check ((select app.is_cms_publisher()));
create policy blog_topics_update on public.blog_topics for update to authenticated
  using ((select app.is_cms_publisher()))
  with check ((select app.is_cms_publisher()));
create policy blog_topics_delete on public.blog_topics for delete to authenticated
  using ((select app.is_cms_publisher()));

drop policy if exists blog_tags_write on public.blog_tags;
create policy blog_tags_insert on public.blog_tags for insert to authenticated
  with check ((select app.is_cms_publisher()));
create policy blog_tags_update on public.blog_tags for update to authenticated
  using ((select app.is_cms_publisher()))
  with check ((select app.is_cms_publisher()));
create policy blog_tags_delete on public.blog_tags for delete to authenticated
  using ((select app.is_cms_publisher()));

drop policy if exists blog_post_tags_write on public.blog_post_tags;
create policy blog_post_tags_insert on public.blog_post_tags for insert to authenticated
  with check ((select app.can_write_post(post_id)));
create policy blog_post_tags_delete on public.blog_post_tags for delete to authenticated
  using ((select app.can_write_post(post_id)));

drop policy if exists publishing_schedules_write on public.publishing_schedules;
create policy publishing_schedules_insert on public.publishing_schedules for insert to authenticated
  with check ((select app.is_cms_publisher()));
create policy publishing_schedules_update on public.publishing_schedules for update to authenticated
  using ((select app.is_cms_publisher()))
  with check ((select app.is_cms_publisher()));
create policy publishing_schedules_delete on public.publishing_schedules for delete to authenticated
  using ((select app.is_cms_publisher()));

drop policy if exists prompt_templates_write on public.prompt_templates;
create policy prompt_templates_insert on public.prompt_templates for insert to authenticated
  with check ((select app.is_super_admin()));
create policy prompt_templates_update on public.prompt_templates for update to authenticated
  using ((select app.is_super_admin()))
  with check ((select app.is_super_admin()));
create policy prompt_templates_delete on public.prompt_templates for delete to authenticated
  using ((select app.is_super_admin()));

drop policy if exists ai_model_profiles_write on public.ai_model_profiles;
create policy ai_model_profiles_insert on public.ai_model_profiles for insert to authenticated
  with check ((select app.is_super_admin()));
create policy ai_model_profiles_update on public.ai_model_profiles for update to authenticated
  using ((select app.is_super_admin()))
  with check ((select app.is_super_admin()));
create policy ai_model_profiles_delete on public.ai_model_profiles for delete to authenticated
  using ((select app.is_super_admin()));

drop policy if exists ad_creatives_write on public.ad_creatives;
create policy ad_creatives_insert on public.ad_creatives for insert to authenticated
  with check ((select app.is_ad_manager()));
create policy ad_creatives_update on public.ad_creatives for update to authenticated
  using ((select app.is_ad_manager()))
  with check ((select app.is_ad_manager()));
create policy ad_creatives_delete on public.ad_creatives for delete to authenticated
  using ((select app.is_ad_manager()));

drop policy if exists ad_placements_write on public.ad_placements;
create policy ad_placements_insert on public.ad_placements for insert to authenticated
  with check ((select app.is_super_admin()));
create policy ad_placements_update on public.ad_placements for update to authenticated
  using ((select app.is_super_admin()))
  with check ((select app.is_super_admin()));
create policy ad_placements_delete on public.ad_placements for delete to authenticated
  using ((select app.is_super_admin()));

drop policy if exists ad_assignments_write on public.ad_assignments;
create policy ad_assignments_insert on public.ad_assignments for insert to authenticated
  with check ((select app.is_ad_manager()));
create policy ad_assignments_update on public.ad_assignments for update to authenticated
  using ((select app.is_ad_manager()))
  with check ((select app.is_ad_manager()));
create policy ad_assignments_delete on public.ad_assignments for delete to authenticated
  using ((select app.is_ad_manager()));

drop policy if exists site_settings_write on public.site_settings;
create policy site_settings_insert on public.site_settings for insert to authenticated
  with check ((select app.is_super_admin()));
create policy site_settings_update on public.site_settings for update to authenticated
  using ((select app.is_super_admin()))
  with check ((select app.is_super_admin()));
create policy site_settings_delete on public.site_settings for delete to authenticated
  using ((select app.is_super_admin()));

drop policy if exists blog_posts_update_publisher on public.blog_posts;
drop policy if exists blog_posts_update_author on public.blog_posts;
create policy blog_posts_update on public.blog_posts for update to authenticated
  using (
    (select app.is_cms_publisher())
    or (
      (select app.has_role(array['author']::text[]))
      and author_id = (select app.uid())
      and status in ('draft', 'review')
    )
  )
  with check (
    (select app.is_cms_publisher())
    or (
      (select app.has_role(array['author']::text[]))
      and author_id = (select app.uid())
      and status in ('draft', 'review')
    )
  );

drop policy if exists blog_posts_delete_publisher on public.blog_posts;
drop policy if exists blog_posts_delete_author on public.blog_posts;
create policy blog_posts_delete on public.blog_posts for delete to authenticated
  using (
    (select app.is_cms_publisher())
    or (
      (select app.has_role(array['author']::text[]))
      and author_id = (select app.uid())
      and status in ('draft', 'review')
    )
  );
