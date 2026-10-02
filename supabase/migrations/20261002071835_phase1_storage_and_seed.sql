insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'blog-public',
    'blog-public',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  ),
  (
    'blog-private',
    'blog-private',
    false,
    20971520,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf']
  ),
  (
    'ad-creatives',
    'ad-creatives',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  );

create policy blog_public_select
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'blog-public');

create policy blog_public_write
  on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-public' and (select app.is_cms_reader()));

create policy blog_public_update
  on storage.objects for update to authenticated
  using (bucket_id = 'blog-public' and (select app.is_cms_reader()))
  with check (bucket_id = 'blog-public' and (select app.is_cms_reader()));

create policy blog_public_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'blog-public' and (select app.is_cms_publisher()));

create policy blog_private_select
  on storage.objects for select to authenticated
  using (bucket_id = 'blog-private' and (select app.is_cms_reader()));

create policy blog_private_write
  on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-private' and (select app.is_cms_reader()));

create policy blog_private_update
  on storage.objects for update to authenticated
  using (bucket_id = 'blog-private' and (select app.is_cms_reader()))
  with check (bucket_id = 'blog-private' and (select app.is_cms_reader()));

create policy blog_private_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'blog-private' and (select app.is_cms_publisher()));

create policy ad_creatives_bucket_select
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'ad-creatives');

create policy ad_creatives_bucket_write
  on storage.objects for insert to authenticated
  with check (bucket_id = 'ad-creatives' and (select app.is_ad_manager()));

create policy ad_creatives_bucket_update
  on storage.objects for update to authenticated
  using (bucket_id = 'ad-creatives' and (select app.is_ad_manager()))
  with check (bucket_id = 'ad-creatives' and (select app.is_ad_manager()));

create policy ad_creatives_bucket_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'ad-creatives' and (select app.is_ad_manager()));

insert into public.ad_placements (
  key, page_scope, desktop_width, desktop_height, mobile_width, mobile_height, mobile_policy, reserve_space, fallback_behavior
) values
  ('homepage_left_rail', 'homepage', 160, 600, null, null, 'hide', true, 'placeholder'),
  ('homepage_right_rail', 'homepage', 160, 600, null, null, 'hide', true, 'placeholder'),
  ('page_left_rail', 'non_homepage', 160, 600, null, null, 'hide', true, 'placeholder'),
  ('page_right_rail', 'non_homepage', 160, 600, null, null, 'hide', true, 'placeholder'),
  ('global_pre_footer', 'all', 728, 90, 320, 100, 'swap', true, 'placeholder'),
  ('article_in_body', 'article', 728, 90, 320, 100, 'swap', true, 'placeholder'),
  ('article_sidebar', 'article', 300, 250, null, null, 'hide', true, 'placeholder'),
  ('homepage_media_showcase', 'homepage', 728, 90, 320, 100, 'swap', true, 'placeholder');

insert into public.prompt_templates (key, version, system_prompt, task_prompt, is_active) values
  (
    'title_ideation',
    1,
    'You generate distinct, high-intent titles for a file-conversion help center. Never invent product capabilities.',
    'Propose titles that map to one search intent and, when relevant, one real AllYouConvert tool slug.',
    true
  ),
  (
    'outline_draft',
    1,
    'You write structured outlines grounded in the local tools catalog. Reject duplicate intent.',
    'Return headings, questions to answer, evidence requirements, and internal-link targets.',
    true
  ),
  (
    'article_draft',
    1,
    'You draft useful conversion guides in the AllYouConvert voice. Stay factual and specific.',
    'Produce a structured article body with accurate steps, tool links, and no unsupported claims.',
    true
  ),
  (
    'seo_metadata',
    1,
    'You write truthful SEO metadata within configured length limits.',
    'Return title tag, meta description, excerpt, FAQ, and image alt suggestions.',
    true
  ),
  (
    'editorial_review',
    1,
    'You review drafts for factual risk, duplication, and missing sections.',
    'Return pass/fail checks and required edits. Never approve fabricated tool behavior.',
    true
  );

insert into public.ai_model_profiles (
  task_key, provider, model_id, prompt_template_id, temperature, thinking_level, max_output_tokens, is_active
)
select
  seed.task_key,
  'google',
  seed.model_id,
  t.id,
  seed.temperature,
  seed.thinking_level,
  seed.max_output_tokens,
  true
from (
  values
    ('title_ideation', 'gemini-3.5-flash-lite', 0.7, 'low', 2048),
    ('outline_draft', 'gemini-3.8-flash', 0.4, 'medium', 8192),
    ('article_draft', 'gemini-3.8-flash', 0.4, 'medium', 16384),
    ('seo_metadata', 'gemini-3.8-flash', 0.3, 'low', 4096),
    ('editorial_review', 'gemini-3.8-flash', 0.2, 'high', 8192)
) as seed(task_key, model_id, temperature, thinking_level, max_output_tokens)
join public.prompt_templates t
  on t.key = seed.task_key and t.is_active;

insert into public.integration_secret_refs (
  provider, secret_ref, masked_suffix, health_status, priority, is_active
) values (
  'google',
  'env:GOOGLE_GENERATIVE_AI_API_KEY',
  'env',
  'unknown',
  1,
  true
);

insert into public.site_settings (key, value, is_public) values
  ('homepage_guide_count', '3'::jsonb, true),
  ('default_publishing_mode', '"draft"'::jsonb, false),
  ('auto_publish_enabled', 'false'::jsonb, false),
  ('article_batch_min', '5'::jsonb, false),
  ('article_batch_max', '15'::jsonb, false),
  ('hosting_target', '"vercel"'::jsonb, false);
