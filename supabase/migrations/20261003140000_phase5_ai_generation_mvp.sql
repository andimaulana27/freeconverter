-- Phase 5 AI generation MVP: illustration profile, secret health counters, generation cap.
-- Additive only. Article intermediate output stays in existing generation_jobs jsonb columns.

alter table public.integration_secret_refs
  add column if not exists consecutive_auth_failures integer not null default 0;

alter table public.integration_secret_refs
  drop constraint if exists integration_secret_refs_failures_check;

alter table public.integration_secret_refs
  add constraint integration_secret_refs_failures_check
  check (consecutive_auth_failures >= 0);

insert into public.prompt_templates (key, version, system_prompt, task_prompt, is_active)
values
  (
    'cover_illustration',
    1,
    'You generate a text-free editorial illustration for AllYouConvert. Never render letters, logos, watermarks, UI chrome, screenshots, or readable words.',
    'Create a 16:9 abstract geometric composition in white, black, gray, and one red accent. No people faces. No product UI.',
    true
  )
on conflict (key, version) do update
set
  system_prompt = excluded.system_prompt,
  task_prompt = excluded.task_prompt,
  is_active = true;

insert into public.ai_model_profiles (
  task_key, provider, model_id, prompt_template_id, temperature, thinking_level, max_output_tokens, is_active
)
select
  'cover_illustration',
  'google',
  'gemini-3.1-flash-image',
  t.id,
  0.8,
  'low',
  4096,
  true
from public.prompt_templates t
where t.key = 'cover_illustration' and t.is_active
on conflict (task_key) do update
set
  provider = excluded.provider,
  model_id = excluded.model_id,
  prompt_template_id = excluded.prompt_template_id,
  temperature = excluded.temperature,
  thinking_level = excluded.thinking_level,
  max_output_tokens = excluded.max_output_tokens,
  is_active = true;

update public.prompt_templates
set
  system_prompt = 'You generate distinct, high-intent titles for AllYouConvert, a browser-first file conversion site. Never invent product capabilities. Each title must map to one search intent and, when relevant, one real tool slug from the catalog.',
  task_prompt = 'Return title candidates only. Prefer useful how-to, comparison, and troubleshooting angles. Reject duplicate intent with existing guides. Use only catalog tool slugs.'
where key = 'title_ideation' and version = 1;

update public.prompt_templates
set
  system_prompt = 'You write structured research briefs and outlines for AllYouConvert guides. Ground every claim in the supplied tool catalog. Browser tools process files on-device; do not describe uploads for those tools.',
  task_prompt = 'Return a brief and an outline with headings, questions, evidence requirements, and internal-link targets. Stay specific to the selected title.'
where key = 'outline_draft' and version = 1;

update public.prompt_templates
set
  system_prompt = 'You draft useful AllYouConvert guides in a clear editorial voice. Stay factual. Use only real tool slugs as same-site paths. Do not fabricate formats, limits, or legal claims.',
  task_prompt = 'Produce a structured article body with headings, steps, a note when privacy/browser processing matters, FAQ, and one tool CTA. Aim for at least 400 useful words.'
where key = 'article_draft' and version = 1;

update public.prompt_templates
set
  system_prompt = 'You write truthful SEO metadata and a visual brief for AllYouConvert. Stay within length limits. Alt text must describe the branded cover, not a fake photograph.',
  task_prompt = 'Return title tag, meta description, excerpt, FAQ, internal-link suggestions, and a visual brief (template, palette, motif, kicker, title lines, illustration prompt with no text).'
where key = 'seo_metadata' and version = 1;

insert into public.site_settings (key, value, is_public)
values ('generation_hourly_job_limit', '8'::jsonb, false)
on conflict (key) do nothing;
