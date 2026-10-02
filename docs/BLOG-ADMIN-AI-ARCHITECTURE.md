# Blog, Admin CMS, Ads, and AI Architecture

Status: architecture approved for implementation planning  
Last updated: 2026-10-02  
Canvas: `blog-admin-ai-architecture.canvas.tsx`

## 1. Product direction

The blog should become a focused acquisition channel for high-intent search traffic without weakening the converter experience. It should help users solve file problems, explain formats, and naturally lead readers to the correct conversion tool.

This system will provide:

- a public, search-optimized blog aligned with the current visual language;
- a secure admin area for writing, reviewing, scheduling, and publishing content;
- controlled ad placements for Google AdSense and manual image campaigns;
- AI-assisted topic, title, outline, and article generation in batches;
- revision history, quality gates, audit logs, and safe publishing controls;
- server-only AI key management with planned rotation and health checks.

This system will not:

- add Blog to the primary header navigation;
- publish unreviewed bulk AI content by default;
- allow arbitrary executable ad scripts from public data;
- expose provider keys, Supabase service credentials, or unpublished content;
- generate hundreds of near-identical tool pages only to increase page count.

## 2. Recommended public placement

### Homepage

Add a compact `Latest guides` section near the end of the homepage, after the main product, trust, and workflow content but before FAQ and the final horizontal ad/footer area. Show three strong articles rather than a large feed:

- one evergreen pillar guide;
- one popular tool tutorial;
- one current troubleshooting or comparison article.

Each article card should use the same light surface, red accent, icon treatment, radius, typography, and content width as the existing homepage. The section should contain one clear `Read all guides` action leading to `/blog`.

### Navigation

Keep `Blog` out of the primary header, as requested. Add it only to the footer under the resource or product links. Public routes remain directly discoverable through the homepage guide section, internal links, sitemap, and search engines.

### Public routes

- `/blog` — featured article, latest guides, and topic filters.
- `/blog/[slug]` — article detail with breadcrumbs, table of contents, related tools, related articles, and ads.
- `/blog/topic/[slug]` — create only after a topic has enough useful articles.
- `/rss.xml` — published article feed.
- `/sitemap.xml` — tools and published articles with accurate update dates.

Draft, review, and scheduled previews must use authenticated admin routes and `noindex`.

## 3. Content strategy

Prioritize search intent and usefulness over publishing volume. Start with small topic clusters around the most-used tools, then expand based on impressions, clicks, converter starts, and content quality.

Recommended article types:

- tool how-to guides with accurate steps and links to the matching converter;
- file-format comparisons that help users choose the correct output;
- troubleshooting articles for common upload, quality, and compatibility issues;
- workflow guides for document, image, audio, video, and archive tasks;
- privacy and browser-processing explainers;
- evergreen format glossaries and compatibility references.

The first release should contain roughly 12–20 reviewed articles. Do not generate one article for every tool at once. After quality and conversion data are stable, produce additional batches of 5–15 drafts.

Every article should answer a distinct search intent, include real tool facts, avoid unsupported claims, and provide useful internal links. AI can accelerate drafting, but editorial quality determines whether the system creates durable SEO value.

## 4. System architecture

### Public application

Next.js App Router renders blog index and article pages as Server Components. Published content is cached and revalidated on publish, update, unpublish, or schedule execution. Public queries can only read rows that are both `published` and within their publication window.

### Admin application

The admin area lives under `/admin` and uses Supabase Auth. It provides:

- dashboard and content health;
- post editor and preview;
- revisions and rollback;
- generation batches and job progress;
- advertising creatives and placements;
- media library;
- AI providers, models, prompts, budgets, and key health;
- publishing schedules;
- users, roles, and audit logs.

### Data and storage

Supabase provides Postgres, Auth, Row Level Security, Storage, and optional queue/cron infrastructure. Cover images and manual ad creatives use separate Storage buckets with explicit policies.

### AI provider boundary

All model calls pass through one server-only provider adapter. The first implementation can use the user's Google AI Studio key through the Google provider. The adapter keeps the application independent from a single model or routing vendor and allows later migration to Vercel AI Gateway without rewriting the content workflow.

### Background processing

A batch of 5–15 articles must not run inside one browser request. The admin action creates a batch and independent jobs. A protected worker processes jobs with retries, heartbeats, cancellation, and stored intermediate output. The UI reads job state from the database and remains safe to refresh or close.

## 5. Data model

### Content

- `blog_posts` stores title, slug, excerpt, structured body, status, SEO fields, cover, author, topic, tool references, publication timestamps, and current revision.
- `blog_post_revisions` stores immutable content snapshots, change source, editor, and restoration metadata.
- `blog_topics` stores focused public topics, descriptions, and SEO metadata.
- `blog_tags` and `blog_post_tags` provide optional cross-topic labels; add only when they improve discovery.
- `media_assets` tracks uploaded covers, inline media, dimensions, alt text, ownership, and Storage paths.
- `publishing_schedules` tracks scheduled publish, unpublish, and retry state.

Recommended post states are `draft`, `review`, `scheduled`, `published`, and `archived`.

### AI generation

- `generation_batches` stores topic, article type, requested count, model profile, publishing mode, progress, cost estimate, and aggregate status.
- `generation_jobs` stores one selected title, outline, generated draft, validation results, attempts, errors, token usage, and linked post.
- `ai_model_profiles` stores task-specific model settings, prompt version, temperature, thinking level, output limits, and active status.
- `prompt_templates` stores versioned system and task prompts for titles, outlines, drafting, SEO, and review.
- `integration_secret_refs` stores only provider, secret reference, masked suffix, health, priority, and usage metadata.

### Advertising

- `ad_creatives` stores type, name, dimensions, Google slot ID or manual media reference, target URL, alt text, active dates, and status.
- `ad_placements` stores stable placement keys, page scope, allowed dimensions, device rules, reserve-space behavior, and fallback behavior.
- `ad_assignments` links one creative to one placement with priority and activation windows.

### Governance

- `admin_profiles` stores display information and product permissions linked to Supabase Auth users.
- `site_settings` stores non-secret defaults such as publishing cadence and homepage guide count.
- `audit_logs` records admin mutations, publishing events, key changes, ad changes, and generation actions.
- `content_metrics` can later aggregate impressions, tool clicks, converter starts, and search performance without blocking the initial release.

## 6. Authentication, authorization, and RLS

Use Supabase Auth with email verification and MFA for administrators. Store trusted role and permission claims in `app_metadata`, never user-editable `user_metadata`.

Initial roles:

- `super_admin` manages users, provider keys, scripts, and all settings;
- `editor` creates, reviews, schedules, and publishes content;
- `author` creates drafts and AI batches but cannot publish or manage secrets;
- `ad_manager` manages creatives and approved placements.

Security rules:

- anonymous users can read only published posts, public topics, and active safe ad configuration;
- authors can access only permitted draft workflows;
- publishing and secret mutations require server-side authorization plus RLS;
- service-role credentials remain server-only and are never shipped to the browser;
- all Storage buckets use explicit read/write policies;
- admin changes write an audit event;
- previews use short-lived authenticated access and `noindex`;
- rate limits protect login, generation, preview, and worker endpoints.

## 7. AI generation workflow

### Admin experience

1. Choose an article type: tool tutorial, comparison, troubleshooting, workflow, privacy, or glossary.
2. Select a suggested topic or enter a custom topic and editorial direction.
3. Choose a batch size from 5–15, audience, language, tone, and target tools.
4. Generate structured title candidates.
5. Select, edit, or reject titles before starting the batch.
6. Watch each job move through research brief, outline, draft, SEO, validation, and review.
7. Open completed drafts, compare revisions, and choose draft, scheduled, or immediate publication.

### Per-article pipeline

1. Resolve tool facts from the local tools catalog and approved product metadata.
2. Build a structured brief with search intent, audience, angle, and internal-link targets.
3. Generate an outline with headings, questions, and evidence requirements.
4. Generate the article body as validated structured output.
5. Generate title tag, meta description, excerpt, FAQ, image brief, and link suggestions.
6. Run deterministic checks for missing sections, invalid tool links, duplication, length, unsafe claims, and metadata limits.
7. Run an optional AI editorial review.
8. Save a revision and create a post in `draft` or `review`.
9. Publish only when the selected mode and quality gates allow it.

Default publishing mode is `draft`. Automatic publishing should remain disabled until reviewed batches consistently pass quality checks. When enabled, it must publish gradually on a configured schedule instead of releasing 15 articles simultaneously.

## 8. Model recommendation

Use `gemini-3.8-flash` as the primary production model for title generation, outlines, drafting, SEO metadata, and standard editorial checks. It is currently the strongest practical fit for this workload because it supports structured output, long context, configurable thinking, and high-throughput generation.

Suggested task profiles:

- title ideation and classification: `gemini-3.5-flash-lite` when cost matters;
- outline, article draft, and final structured payload: `gemini-3.8-flash`;
- optional high-stakes editorial review: a stronger verified production model, not a preview-only dependency;
- optional generated covers later: a supported Gemini image model behind the same provider adapter.

When implementation starts, verify current model IDs and pricing again. Model availability changes faster than the application architecture.

Use AI SDK structured generation with `generateText` and `Output.object()` schemas. Validate every payload again on the server before storing or publishing it.

## 9. API key management and rotation

Keys must never be stored in browser state, client bundles, logs, article records, or plaintext settings.

MVP:

- use one server-only `GOOGLE_GENERATIVE_AI_API_KEY`;
- show only provider status and masked suffix in admin;
- expose a protected connection test;
- record failures and disable generation after repeated authentication errors.

Managed rotation:

- write new keys through a server action into Supabase Vault or a managed secret service;
- store only the secret reference and masked metadata in application tables;
- allow activation, priority changes, health tests, and revocation;
- select a healthy active key server-side;
- fail over only for availability or planned rotation, never to evade quotas;
- record who changed a key and when;
- prevent retrieval of the original plaintext value after creation.

Add generation budgets, per-batch limits, daily quotas, timeout policies, and token/cost logging before enabling unattended publishing.

## 10. Advertising architecture

Retain fixed-size ad slots to prevent layout shift and protect user experience.

Supported creative types:

- Google AdSense using a verified global client ID and per-unit slot ID;
- manual image creative uploaded to Storage with target URL and alt text;
- empty fallback that preserves or releases space according to placement policy.

Do not store arbitrary executable JavaScript per placement. The admin can paste AdSense setup data, but the server must parse and save structured fields such as client ID, slot ID, width, and height. Load the approved Google script once globally.

Initial placement registry:

- homepage left and right vertical rails beginning below the hero and stopping before the footer;
- non-homepage vertical rails using the current behavior;
- one horizontal slot before the footer on every public page;
- one in-article horizontal slot after a meaningful content boundary;
- one article sidebar slot on layouts that have enough width;
- optional homepage slot after the media/file-type showcase.

Rules:

- every placement has fixed desktop dimensions and an explicit mobile policy;
- ads never cover controls, content, cookie controls, or navigation;
- manual creatives use meaningful alt text and `rel="sponsored"` links;
- reserved space avoids cumulative layout shift;
- preview mode shows placement boundaries before activation;
- start and end times allow campaigns without code changes;
- unpublished article previews do not load production ads by default.

## 11. Visual language

Public blog:

- reuse the site content width, header/footer, light surfaces, borders, radii, red accent, icon style, and typography rhythm;
- prioritize article readability with a narrower prose column inside the shared outer container;
- use restrained cards for related tools, related guides, and ad frames;
- preserve strong hierarchy with breadcrumbs, category, title, summary, author/update data, body, FAQ, related content, and final CTA.

Admin:

- use the same design tokens but a denser application layout;
- keep status, validation, and progress visible without decorative dashboards;
- use a left navigation on desktop and compact navigation on smaller screens;
- provide clear empty, loading, error, retry, and autosave states;
- preview public articles in their real public layout.

## 12. SEO and quality safeguards

Every published article requires:

- one canonical URL and unique slug;
- useful title tag and meta description within configured limits;
- server-rendered body content;
- Article and Breadcrumb JSON-LD with truthful fields;
- accurate `datePublished` and `dateModified`;
- descriptive image alt text;
- internal links to relevant tools and supporting guides;
- sitemap inclusion only after publication;
- noindex for previews, drafts, thin archives, and admin routes;
- redirect support when a published slug changes.

Quality gates should reject or hold content with duplicate intent, fabricated capabilities, invalid tool URLs, unsupported legal/privacy claims, broken structure, or excessive similarity to existing posts.

## 13. Implementation phases

### Phase 0 — architecture and source of truth

Status: complete

- approve routes, roles, data boundaries, AI workflow, ads rules, and phased delivery;
- create this architecture document and the linked Canvas;
- add a persistent project rule requiring both artifacts to be updated.

Acceptance: documentation names all major decisions, risks, and next phases.

### Phase 1 — secure foundation

Status: planned

- add Supabase server/browser clients, admin Auth, MFA-ready login, and role checks;
- create migrations for core CMS, generation, ads, settings, and audit entities;
- add RLS and Storage policies;
- seed stable ad placement keys and initial model profiles;
- verify migrations with security and performance advisors.

Acceptance: unauthorized users cannot access admin data, drafts, secrets, or private media.

### Phase 2 — public blog and SEO

Status: planned

- build `/blog` and `/blog/[slug]` with the current visual language;
- add homepage `Latest guides` and footer-only Blog navigation;
- add metadata, canonical URLs, JSON-LD, sitemap entries, RSS, and breadcrumbs;
- add related tools and guides;
- verify desktop, tablet, mobile, and noindex behavior.

Acceptance: published posts are indexable, drafts are private, and public layout matches the site.

### Phase 3 — admin CMS

Status: planned

- build dashboard, post list, structured editor, preview, revisions, and media library;
- add draft, review, publish, unpublish, archive, and scheduled workflows;
- add autosave, conflict handling, slug redirects, and audit events;
- implement role-specific controls.

Acceptance: an editor can create, preview, revise, schedule, publish, and restore an article safely.

### Phase 4 — ads manager

Status: planned

- build creative, placement, assignment, preview, scheduling, and activation controls;
- support structured AdSense units and manual image creatives;
- connect existing fixed-size slots to cached placement configuration;
- verify layout stability, mobile behavior, and footer stopping rules.

Acceptance: an ad manager can update creatives without shipping code or injecting arbitrary scripts.

### Phase 5 — AI generation MVP

Status: planned

- implement provider adapter, key health, model profiles, and prompt versions;
- generate structured topic and title candidates;
- generate one selected article through brief, outline, draft, SEO, and validation;
- save output as a revisioned draft;
- capture token usage, model ID, prompt version, errors, and audit events.

Acceptance: AI output is schema-valid, traceable, editable, and never auto-published by default.

### Phase 6 — durable batch generation

Status: planned

- add 5–15 article batches, independent jobs, queue worker, retries, cancellation, and progress;
- add budgets, concurrency limits, idempotency, timeouts, and failure recovery;
- add draft, scheduled, and gated automatic publication modes;
- add secure multi-key rotation and failover.

Acceptance: refreshing or closing admin does not interrupt generation and failed jobs recover safely.

### Phase 7 — editorial quality and growth

Status: planned

- add similarity detection, intent collision checks, fact validation, and editorial review;
- add internal-link suggestions based on tools and content clusters;
- connect Search Console and privacy-safe product conversion metrics;
- tune article types, cadence, ads, and model profiles using real outcomes;
- add rollback and alerting for publishing or ad failures.

Acceptance: growth decisions use quality, search, and converter data rather than article count alone.

## 14. Risks and guardrails

- SEO risk: mass low-value AI content can reduce trust and search performance. Start with reviewed batches and measured topic clusters.
- Factual risk: models may invent unsupported tool behavior. Ground every article in the local tool catalog and deterministic checks.
- Cost risk: 15 parallel long drafts can spike usage. Enforce queues, concurrency, budgets, and task-specific model profiles.
- Security risk: arbitrary scripts and plaintext keys create severe exposure. Store structured ad data and server-only secret references.
- Publishing risk: automatic release can expose poor content. Keep `draft` as default and require quality gates.
- Operational risk: one long request is fragile. Use independent durable jobs with retries and idempotency.
- UX risk: excessive ads can reduce retention and converter use. Keep fixed placements away from core controls and measure impact.

## 15. Living documentation protocol

This file and the Canvas are shared source-of-truth artifacts.

Whenever a phase or meaningful sub-phase is completed:

1. update its status here from `planned` to `in progress`, `blocked`, or `complete`;
2. add the completion date and summarize decisions that differ from this plan;
3. update schema, routes, security, model, and ad details if implementation changed them;
4. update the matching status and flow in the Canvas;
5. record verification evidence and remaining follow-up work;
6. commit the implementation and both documentation updates together.

An implementation phase is not complete until both artifacts match the actual code and database state.

## 16. Immediate next step

Begin Phase 1 with a schema and RLS design review before applying any migration. Confirm the Supabase project, admin account strategy, hosting target, and whether AI secrets will start in environment variables or Supabase Vault.
