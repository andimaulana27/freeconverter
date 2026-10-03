# Blog, Admin CMS, Ads, and AI Architecture

Status: Phase 7 complete; operational closeout shipped (media library, Vault rotation, gated topic archives, signup lock). Product DNA and the convert rollout canvas match this status.  
Last updated: 2026-10-03  
Canvas: `blog-admin-ai-architecture.canvas.tsx`

## 1. Product direction

The blog should become a focused acquisition channel for high-intent search traffic without weakening the converter experience. It should help users solve file problems, explain formats, and naturally lead readers to the correct conversion tool.

This system will provide:

- a public, search-optimized blog aligned with the current visual language;
- a secure admin area for writing, reviewing, scheduling, and publishing content;
- controlled ad placements for Google AdSense and manual image campaigns;
- AI-assisted topic, title, outline, and article generation in batches;
- automatic, article-specific covers and supporting visuals using branded templates with optional AI-generated illustration;
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

- `/blog` — featured article, latest guides, and topic filters. Topic filters use `?topic=` and stay `noindex` until that topic has two published indexable guides, then `/blog/topic/[slug]` is created and indexed.
- `/blog/[slug]` — article detail with breadcrumbs, table of contents, related tools, related articles, and ads.
- `/blog/topic/[slug]` — public archive when a topic has at least two published indexable guides.
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

The admin area lives under `/admin` and uses Supabase Auth. Phase 1 shipped login, MFA challenge, role-gated dashboard chrome, and `noindex` on every admin route. Phase 3 shipped the CMS dashboard, post list, structured editor, authenticated preview, revisions, cover controls, and draft/review/publish/unpublish/archive/schedule actions. Phase 4 shipped the ads manager for structured AdSense units, image creatives, and assignments to the fixed slots. Phases 5–6 shipped generation batches, job progress, model profiles, prompts, budgets, and key health. Phase 7 shipped editorial quality and `/admin/growth`. The operational closeout shipped `/admin/media` and Vault key rotation. Remaining product follow-up (not a new roadmap phase):

- a richer users, roles, and audit UI;
- live Search Console OAuth if CSV ingest becomes too manual.

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
- `media_assets` tracks uploaded or generated covers and inline media, dimensions, alt text, ownership, Storage paths, source (`upload`, `template`, or `ai`), focal point, variant, and approval.
- `blog_post_media` stores ordered, typed relations such as `cover`, `inline`, `diagram`, and `social`.
- `blog_slug_redirects` maps retired public slugs to the current slug when a published guide is renamed.
- `publishing_schedules` tracks scheduled publish, unpublish, and retry state.

Recommended post states are `draft`, `review`, `scheduled`, `published`, and `archived`.

### AI generation

- `generation_batches` stores topic, article type, requested count, model profile, publishing mode, progress, cost estimate, cancel request, and aggregate status.
- `generation_jobs` stores one selected title, outline, generated draft, validation results, attempts, errors, token usage, heartbeats, and linked post.
- `generation_media_jobs` stores independent illustration jobs with retries, moderation, provenance, and cost so a failed image does not discard the article draft.
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
- `content_metrics_daily` stores privacy-safe day-and-path aggregates (guide views, tool starts, guide-to-tool clicks, optional Search Console impressions/clicks). No reader identifiers or search queries are stored.

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

Phase 1 implementation notes:

- authorization reads `auth.jwt() -> app_metadata.role`, never `user_metadata`;
- `admin_profiles.role` is a trigger-synced copy of that claim and is not client-writable;
- RLS helper functions live in private schema `app` and are wrapped in `SELECT` so they evaluate once per query;
- every application table uses `ENABLE` and `FORCE ROW LEVEL SECURITY`;
- MFA is enforced in admin middleware when a user is enrolled (`aal2`). Table-wide AAL2 RLS is deferred so a signed-in editor can still load public pages;
- `integration_secret_refs` is super-admin only and stores `env:` or `vault:` references plus a masked suffix, never plaintext keys.

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
5. Generate title tag, meta description, excerpt, FAQ, link suggestions, and a structured visual brief.
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

Phase 5 verified IDs (2026-10-03): `gemini-3.5-flash-lite` (titles), `gemini-3.8-flash` (outline, draft, SEO), `gemini-3.1-flash-image` (optional illustration). Thinking levels used are `low`, `medium`, and `high`. `minimal` is not sent because `gemini-3.8-flash` rejects it.

Use AI SDK structured generation with `generateText` and `Output.object()` schemas. Validate every payload again on the server before storing or publishing it.

### Automated covers and supporting visuals

Use a hybrid visual pipeline rather than asking an image model to render a finished cover:

- render title, brand mark, typography, solid or gradient fill, texture, and decorative motifs from deterministic SVG/CSS templates;
- select template, palette, motif, and title line breaks from a validated visual brief derived from article type, topic, and slug;
- use a stable article seed so regeneration is idempotent while different articles still receive distinct compositions;
- optionally generate a text-free illustration through the server-only Google provider, then composite it behind the programmatic title layer;
- use real product screenshots for tutorials and deterministic SVG diagrams for factual workflows, never potentially misleading AI replacements;
- generate separate hero and social variants with safe text areas instead of relying on destructive crops;
- require meaningful alt text, contrast checks, file-size limits, moderation, provenance, and editor approval before publication.

The admin editor offers `Auto template`, `AI illustration`, `Upload`, and `No image`, plus regenerate, focal-point, alt-text, and approval controls. AI image generation runs as an independent retriable media job and must not discard an otherwise valid article draft when it fails.

## 9. API key management and rotation

Keys must never be stored in browser state, client bundles, logs, article records, or plaintext settings.

MVP (Phase 1):

- use one server-only `GOOGLE_GENERATIVE_AI_API_KEY`;
- store the reference `env:GOOGLE_GENERATIVE_AI_API_KEY` in `integration_secret_refs`;
- show only provider status and masked suffix in admin;
- expose a protected connection test in a later phase;
- record failures and disable generation after repeated authentication errors.

Managed rotation (operational closeout):

- write new keys through a server action into Supabase Vault;
- store only the secret reference and masked metadata in application tables;
- allow activation, health tests, and revocation;
- select a healthy active key server-side, with the env key as last-resort fallback;
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

Status: complete  
Completed: 2026-10-02

- add Supabase server/browser clients, admin Auth, MFA-ready login, and role checks;
- create migrations for core CMS, generation, ads, settings, and audit entities;
- add RLS and Storage policies;
- seed stable ad placement keys and initial model profiles;
- verify migrations with security and performance advisors.

Acceptance: unauthorized users cannot access admin data, drafts, secrets, or private media.

#### Phase 1 decisions

- Dedicated Supabase project **AllYouConvert** (`apktgfjwgsngbtvhlwen`, region `ap-southeast-1`) hosts Postgres 17, Auth, Storage, and RLS. Hosting target remains Vercel (`site_settings.hosting_target`).
- AI secrets start as the server-only env var `GOOGLE_GENERATIVE_AI_API_KEY`. Vault rotation remains follow-up.
- The first `super_admin` is provisioned through the server-only Auth Admin API with `raw_app_meta_data.role = super_admin`; email is confirmed and the trigger-synced `admin_profiles` row is active. The app has no public signup UI.
- Public pages moved into the `(site)` route group so converter chrome and ads do not wrap `/admin`.
- Write policies that used `FOR ALL` were split into insert/update/delete after a security-advisor warning about overlapping permissive SELECT policies.
- Storage object policies for the ad bucket are named `ad_creatives_bucket_*` so they do not clash with table policies.
- Local Docker is not required; migrations in `supabase/migrations/` are the source of truth and were applied to the remote project.

#### Phase 1 schema and seeds

Application tables (all RLS enabled and forced): `admin_profiles`, `blog_topics`, `media_assets`, `blog_posts`, `blog_post_revisions`, `blog_tags`, `blog_post_tags`, `publishing_schedules`, `prompt_templates`, `ai_model_profiles`, `generation_batches`, `generation_jobs`, `integration_secret_refs`, `ad_creatives`, `ad_placements`, `ad_assignments`, `site_settings`, `audit_logs`.

Public post visibility requires `status = published`, `published_at <= now()`, and an open `unpublished_at` window. Authors may insert/update/delete only their own `draft`/`review` rows and cannot publish or schedule. Secret refs, prompt templates, model profiles, and placement keys are super-admin writes.

Storage buckets: `blog-public` (public images), `blog-private` (authenticated CMS readers), `ad-creatives` (public images, ad-manager writes).

Seeds: 8 placement keys, 5 prompt templates, 5 model profiles (`gemini-3.5-flash-lite` for titles; `gemini-3.8-flash` for outline, draft, SEO, review), 1 Google env secret ref, 6 site settings including `default_publishing_mode = draft` and `auto_publish_enabled = false`. Phase 4 later added two converter placement keys and public `adsense_client_id`.

#### Phase 1 routes and clients

- Cookie clients: `src/lib/supabase/{env,client,server,middleware}.ts` via `@supabase/ssr`.
- Service-role client: `src/lib/supabase/service.ts` (`import "server-only"`).
- Role helpers: `src/lib/auth/roles.ts` (`super_admin`, `editor`, `author`, `ad_manager`).
- `/admin/login` — staff sign-in, `noindex`, no public header or ads.
- `/admin/mfa` — TOTP challenge when enrolled users are below AAL2.
- `/admin` — role-gated foundation dashboard.
- `/admin/security` — authenticated password change with current-password reauthentication, confirmation, a 12-character minimum, and a direct TOTP management link.
- `robots.ts` disallows `/admin`.
- Public converter routes stay under `(site)` with Blog still absent from the primary header.

#### Phase 1 verification

- Security advisor: no findings after the policy split and FORCE RLS.
- Performance advisor: unused-index INFO on an empty database (indexes kept); Auth “10 connections” INFO left as default.
- Anonymous REST: unpublished `blog_posts` are not visible; 8 `ad_placements` are readable; secret refs are not granted to `anon`.
- Browser: homepage and `/image-compressor` keep converter chrome and no Blog in the header; `/admin` redirects to `/admin/login`; `/privacy` still uses the public shell.
- First administrator: confirmed Auth user, `super_admin` claim, active trigger-created profile, successful login, and role-scoped dashboard reads verified.
- Security settings: `/admin/security` loads for the authenticated administrator and rejects mismatched password confirmation without mutating the password.
- Production build and lint pass with no errors; remaining warnings are non-blocking and unrelated to the foundation acceptance criteria.

#### Phase 1 follow-up (does not block Phase 2)

- Disable public signup in Auth settings.
- Enroll TOTP MFA on that account.
- Connection tests, generation, and CMS screens remain later phases.

### Phase 2 — public blog and SEO

Status: complete  
Completed: 2026-10-03

- build `/blog` and `/blog/[slug]` with the current visual language;
- add homepage `Latest guides` and footer-only Blog navigation;
- add metadata, canonical URLs, JSON-LD, sitemap entries, RSS, and breadcrumbs;
- add related tools and guides;
- verify desktop, tablet, mobile, and noindex behavior.

Acceptance: published posts are indexable, drafts are private, and public layout matches the site.

#### Phase 2 decisions

- Public reads use a session-less anon client, then filter `status = published` plus the publication window. A signed-in editor does not see drafts on `/blog`.
- Article bodies are version `1` structured JSON. The renderer keeps known blocks as plain text and drops anything else. Internal links must be same-site paths and cannot point at `/admin`.
- The byline is AllYouConvert. `admin_profiles` stays staff-only, so public pages do not join it.
- Homepage order comes from public `site_settings.homepage_guide_slugs`, then fills from the latest published posts up to `homepage_guide_count` (3).
- `/blog?topic=` is `noindex` with a canonical of `/blog`. Dedicated topic routes stay deferred.
- Published pages revalidate every 300 seconds. Phase 3 also calls `revalidatePath` on publish, archive, and saves to already-published posts.
- Covers render only when the asset is public and stored in `blog-public`.
- `noindex` posts can stay published and readable, and they are left out of the sitemap and RSS.
- Three hand-reviewed launch guides are seeded. They are not an AI batch. `/blog/topic/[slug]` is gated to topics with two or more published indexable guides, so the three launch topics stay on `?topic=` until the library grows.

#### Phase 2 routes

- `/blog` — featured guide, remaining guides, topic chips, RSS link.
- `/blog/[slug]` — breadcrumbs, prose, table of contents, in-article leaderboard after the first section, desktop sidebar rectangle, related tools, related guides, and a tool CTA.
- `/rss.xml` — published guides with `noindex = false`.
- `/sitemap.xml` — `/blog`, published indexable guides, and topic archives that meet the two-guide minimum, with `lastModified` from `updated_at`.
- Homepage `Latest guides` sits after the privacy section and before FAQ. Footer column AllYouConvert includes Blog. The primary header does not.

#### Phase 2 verification

- Anon REST returned the three published slugs and an empty array for draft `phase2-draft-probe`. That draft and an unknown slug both 404 on `/blog/[slug]`. The probe row was deleted after the check.
- `/blog` and the PNG guide are `index, follow` with canonicals on `allyouconvert.com`. `?topic=tutorials` is `noindex, follow` and canonicalizes to `/blog`.
- Setting `noindex` on the HEIC guide produced `noindex, follow` and removed it from RSS and the sitemap. The flag was turned back off.
- Desktop (1613px), tablet (768px), and phone (390px) rendered the guide without horizontal overflow. The sidebar ad is hidden below the large breakpoint; the phone uses the collapsible contents list.
- Homepage shows the three launch guides before FAQ. Header links stay converter categories. Footer includes Blog.
- Article JSON-LD includes `Article`, `BreadcrumbList`, and `FAQPage`. The PNG guide links related tools to `/png-to-jpg` and `/image-compressor`.

#### Phase 2 follow-up (does not block Phase 3)

- Topic landing pages wait until a topic has more than a single guide. The gated `/blog/topic/[slug]` route now enforces that minimum.
- Public Auth signup is locked in `supabase/config.toml`. TOTP should still be enrolled on the first administrator.

### Phase 3 — admin CMS

Status: complete  
Completed: 2026-10-03

- build dashboard, post list, structured editor, preview, and revisions;
- add automatic-template, upload, regenerate, focal-point, alt-text, and image-approval controls in the editor (AI illustration stays Phase 5);
- add draft, review, publish, unpublish, archive, and scheduled workflows;
- add autosave, conflict handling, slug redirects, and audit events;
- implement role-specific controls.

Acceptance: an editor can create, preview, revise, schedule, publish, and restore an article safely.

#### Phase 3 decisions

- The editor writes the same Phase 2 `BlogBody` v1 blocks (`paragraph`, `heading`, `list`, `steps`, `faq`, `note`, `cta`). There is no second article schema.
- Autosave runs about 2.2 seconds after edits and compares `updated_at`. A mismatch returns a conflict and asks the editor to reload.
- Quality gates run on publish and schedule, not on draft save or submit-for-review. Gates cover title/slug/excerpt/SEO length, heading plus paragraph, ~400 words, valid catalog tool links, and cover alt/approval/public bucket when a cover exists.
- Authors can create and submit drafts. Publish, unpublish, archive, and schedule are limited to `editor` and `super_admin`. Media approval is publisher-only in both the UI and a trigger.
- Covers can be uploaded or generated as a branded SVG template. The AI illustration control is visible and disabled until Phase 5.
- `blog_slug_redirects` are written only when a **published** slug changes. Public `/blog/[slug]` issues a 308 when the old slug still points at a live published target.
- Authenticated preview reuses `GuideArticle` inside `SiteShell` with `ads={false}` and `noindex`.
- Due schedules are processed by `GET/POST /api/cron/publish` (Vercel cron `*/5 * * * *`, `Authorization: Bearer $CRON_SECRET`) and also when a publisher opens `/admin`.
- Publish and archive call `revalidatePath` for `/`, `/blog`, the slug, sitemap, and RSS. Scheduled publish keeps the post’s `noindex` flag instead of forcing index.
- A standalone media library page is not in this phase. Cover upload, template, focal point, alt text, and approval live in the post editor. `/admin/media` shipped later in the operational closeout.

#### Phase 3 schema

Additive remote migration `20261003021058_phase3_cms_media_and_redirects` (20 application tables): `blog_post_media`, `blog_slug_redirects`, and provenance columns on `media_assets`. SVG is allowed in the blog Storage buckets. RLS remains ENABLE + FORCE.

#### Phase 3 routes

- `/admin` — content health counts, recent guides, pending-schedule processor for publishers.
- `/admin/posts` — filterable list (status, topic, title/slug search).
- `/admin/posts/new` — create a draft and redirect into the editor.
- `/admin/posts/[id]` — structured editor, related tools, cover controls, quality gate, publishing actions.
- `/admin/posts/[id]/preview` — noindex article preview without production ads.
- `/admin/posts/[id]/revisions` — restore a snapshot into the current row without publishing.
- `/api/cron/publish` — 401 without `CRON_SECRET`.
- `/blog/[slug]` — 308 through `blog_slug_redirects` when the target is still published.

#### Phase 3 verification

- Super admin `admin@allyouconvert.com` created draft `phase3-cms-verification-draft`, autosaved heading/paragraph/tool link, generated an approved branded cover, saved a revision, restored it, previewed with ads off, and submitted for review. Audit events recorded `post.create`, `post.save`, `post.cover_template`, `post.revision`, `post.restore`, and `post.submit_review`.
- Public `/blog/phase3-cms-verification-draft` returned 404 while the row was draft/review. Unauthenticated `/admin/posts` redirected to login. `/api/cron/publish` returned 401. Primary header still has no Blog link.
- A temporary `phase3-slug-redirect-probe` row 308’d to `/blog/convert-png-to-jpg-in-the-browser`. The probe redirect and the verification post were deleted afterward. Live published slugs remain the three launch guides.
- Publish was not executed on the short verification draft. The quality gate correctly required more body copy, and the production blog was left unchanged.
- `npx tsc --noEmit` passed after the CMS routes landed.

#### Phase 3 follow-up (does not block Phase 4)

- Standalone media library shipped in the operational closeout (`/admin/media`).
- Set `CRON_SECRET` on Vercel before relying on production schedule execution.
- Two-tab conflict handling is implemented; it was not exercised as a dual-session browser test.
- Topic landing pages shipped as gated `/blog/topic/[slug]` (indexable only with 2+ published guides). Auth signup is locked in `supabase/config.toml`. TOTP enrollment remains a staff action.

### Phase 4 — ads manager

Status: complete  
Completed: 2026-10-03

- build creative, placement, assignment, preview, scheduling, and activation controls;
- support structured AdSense units and manual image creatives;
- connect existing fixed-size slots to cached placement configuration;
- verify layout stability, mobile behavior, and footer stopping rules.

Acceptance: an ad manager can update creatives without shipping code or injecting arbitrary scripts.

#### Phase 4 decisions

- Existing converter in-page units were not in the original 8-key registry. Phase 4 added `page_in_body` (728×90 / 320×100 swap) and `page_sidebar` (300×250, hide on small screens) so every current `AdSlot` has a placement key.
- `SiteShell` loads cached public ad config (`ads-public`, 60s) and provides it to every public slot. Article previews still use `ads={false}` and do not load the AdSense script.
- AdSense paste is parsed into `ca-pub-` client ID, numeric slot ID, width, and height. The original snippet is discarded. The approved Google script loads once when an active AdSense unit exists.
- Super admins store a verified public `site_settings.adsense_client_id`. Ad managers cannot write that setting. Per-unit env slot IDs remain a fallback only until a CMS assignment wins.
- Image creatives upload to the `ad-creatives` bucket with `rel="sponsored"` links. Empty creatives reserve or collapse space from the placement fallback.
- Drafts may be incomplete. Activating an AdSense unit without a slot ID, or an image without media/URL/alt, is blocked in application code and by `app.guard_ad_creative_activation`.
- Placement keys and desktop sizes stay super-admin policy. Ad managers assign creatives with priority and start/end windows.

#### Phase 4 schema

Additive remote migration `phase4_ads_manager` (still 20 application tables): two placement keys, public `adsense_client_id`, fallback/AdSense/URL checks, and the activation trigger. RLS remains ENABLE + FORCE.

#### Phase 4 routes

- `/admin/ads` — placement board, live winner, assign, creative list, verified client (super admin).
- `/admin/ads/new` — create an AdSense, image, or empty draft.
- `/admin/ads/[id]` — structured fields, image upload, snippet parse, status, assignments, reserved-frame preview (no live AdSense).
- `/admin/ads/preview` — placement-boundary schematic.
- Public `AdSlot` instances now take a `placement` key: homepage rails, page rails, pre-footer, article in-body/sidebar, homepage showcase, converter in-page leaderboards, and converter sidebar.

#### Phase 4 verification

- Anon REST: 10 `ad_placements` readable; active empty probe `phase4-ads-verification-live` visible with its assignment; draft `phase4-ads-verification-draft` hidden; `integration_secret_refs` denied (401). Probe rows were deleted afterward.
- Activating an AdSense creative without a slot ID raised `Active AdSense creatives require a slot ID`.
- Unauthenticated `/admin/ads` and `/admin/ads/preview` 307 to login. `/admin/login` has no ad frames.
- Homepage HTML: 3 advertisement asides (showcase, in-page, pre-footer), no AdSense script without a client ID, Blog in the footer only. Header links stay converter categories.
- `/blog/convert-png-to-jpg-in-the-browser` keeps 3 ad frames (in-body, sidebar, pre-footer). `/png-to-jpg` keeps 4 (two in-page, sidebar, pre-footer). Side rails stay client-gated to wide viewports and `absolute bottom-0` inside `main`, so they stop before the footer.
- `npx tsc --noEmit` passed after the ads manager landed.

#### Phase 4 follow-up (does not block Phase 5)

- Env per-unit slot IDs can be removed after production assignments exist.
- A logged-in click-through of `/admin/ads` was not available in this session; unauthenticated redirects and the nested assignment select were checked instead.
- Auth leaked-password protection remains a project-settings WARN. TOTP enrollment and `CRON_SECRET` on Vercel remain staff/runtime setup.

### Phase 5 — AI generation MVP

Status: complete  
Completed: 2026-10-03

- implement provider adapter, key health, model profiles, and prompt versions;
- generate structured topic and title candidates;
- generate one selected article through brief, outline, draft, SEO, and validation;
- generate a structured visual brief and deterministic branded cover, with optional text-free Google AI illustration;
- save output as a revisioned draft;
- capture token usage, model ID, prompt version, errors, and audit events.

Acceptance: AI output is schema-valid, traceable, editable, and never auto-published by default.

#### Phase 5 decisions

- The first adapter is Google AI Studio through `@ai-sdk/google` `createGoogle({ apiKey })` and `GOOGLE_GENERATIVE_AI_API_KEY`. Vercel AI Gateway stays a later swap behind the same `generateStructured` / `generateIllustrationPng` boundary.
- Structured calls use AI SDK `generateText` with `Output.object()` and Zod schemas, then `parseBlogBody` plus publish-quality checks before save.
- MVP generated 5–15 titles, then **one** selected article in the admin request (`generation_batches.requested_count = 1`, `publishing_mode = draft`). Phase 6 replaced that with a durable 5–15 job queue.
- Brief+outline share one model call; SEO+visual brief share one call. Draft is a separate call. Intermediate JSON stays in existing `generation_jobs` jsonb columns (`outline`, `draft`, `validation`, `token_usage`).
- Optional illustration uses `gemini-3.1-flash-image` (`cover_illustration` profile). Failure records `coverError` and must not discard the article draft. The editor AI illustration control is live; it composites a text-free image behind the branded SVG title layer.
- Covers pick template/palette/motif from the visual brief, with a slug seed fallback. Title typography is always coded SVG, never model-rendered text.
- Super admins can test the provider from `/admin/generate`. Repeated authentication errors increment `consecutive_auth_failures` and disable generation after three failures. The key value never leaves the server.
- Authors and editors can start draft batches. Publish, schedule, and media approval stay publisher-only. Hourly cap is `site_settings.generation_hourly_job_limit` (8).
- Editorial-review profile remains seeded and unused in this phase.

#### Phase 5 schema

Additive remote migration `phase5_ai_generation_mvp` (still 20 application tables): `cover_illustration` prompt + model profile, `integration_secret_refs.consecutive_auth_failures`, and `generation_hourly_job_limit`. RLS remains ENABLE + FORCE. Anon still has no grants on generation or secret tables.

#### Phase 5 routes

- `/admin/generate` — direction form, provider health (super admin), recent batches. `noindex`. `maxDuration` 300.
- `/admin/generate/[id]` — edit/reject titles, generate one draft, job trace (model IDs, tokens, stage).
- `/admin/posts/[id]` — AI illustration cover control enabled.
- Public converter and blog routes unchanged. Blog stays out of the primary header.

#### Phase 5 verification

- `npx tsc --noEmit` passed after the generation adapter, CMS cover helper, and admin Generate routes landed.
- Remote migration applied to AllYouConvert: 6 model profiles including `cover_illustration` / `gemini-3.1-flash-image`; `consecutive_auth_failures` present; hourly limit 8.
- Security advisor: no new findings (existing Auth leaked-password WARN unchanged). Performance advisor: unused-index INFO on a quiet database (indexes kept).
- Grants: `anon` has no privileges on `generation_batches`, `generation_jobs`, `integration_secret_refs`, `ai_model_profiles`, or `prompt_templates`. Those remain `authenticated` + RLS.
- Browser: unauthenticated `/admin/generate` redirected to `/admin/login?next=%2Fadmin%2Fgenerate`. Homepage primary nav stays converter categories; Blog remains footer-only. Latest guides still render before FAQ.
- A signed-in title-to-draft click-through was not available in this session. The Google env key is present locally for a later staff test.

#### Phase 5 follow-up (does not block Phase 6)

- Run a logged-in generation of titles plus one draft and confirm audit events `generation.titles` / `generation.article` / `post.cover_ai`.
- Durable 5–15 article jobs, retries, cancellation, and budgets shipped in Phase 6.
- Optional editorial-review pass and AI Gateway routing remain later work.

### Phase 6 — durable batch generation

Status: complete  
Completed: 2026-10-03

- add 5–15 article batches, independent jobs, queue worker, retries, cancellation, and progress;
- process AI supporting images as independent idempotent media jobs with retry, moderation, provenance, and cost tracking;
- add budgets, concurrency limits, idempotency, timeouts, and failure recovery;
- add draft, scheduled, and gated automatic publication modes.

Acceptance: refreshing or closing admin does not interrupt generation and failed jobs recover safely.

#### Phase 6 decisions

- The worker is a Postgres claim-lock plus Vercel cron, not the Vercel Workflow SDK. `/api/cron/generate` runs every minute (`* * * * *`, `maxDuration` 300) with the same `CRON_SECRET` bearer check as publish. Enqueue, retry, and the batch progress page also kick the worker with `after()` so local admin use does not wait on cron.
- Each selected title becomes its own `generation_jobs` row with a unique `idempotency_key`. Claim uses `FOR UPDATE SKIP LOCKED` in private schema `app`. Public RPC wrappers are `security definer`, `search_path = public, pg_temp`, and reject any caller whose `auth.role()` is not `service_role`. Execute is granted only to `service_role`.
- Intermediate outline/draft JSON stays on the job, so a retry resumes instead of starting over. Cancel sets `cancel_requested` on the batch and pending jobs immediately; running jobs stop at the next checkpoint. Stale running rows (heartbeat older than 300s) are recovered to pending, failed, or cancelled.
- Optional illustrations enqueue `generation_media_jobs` after the draft is saved. A failed or rejected image does not discard the article. The post editor AI cover control stays in-request and does not create a media job.
- Hourly cap is `site_settings.generation_hourly_job_limit` (24) so a 15-article batch fits. Default concurrency is 2 article jobs and 2 media jobs. Checkpoint timeout is 240 seconds. Manual retry resets attempts.
- Default publishing mode remains `draft`. Authors cannot select scheduled or auto. Auto-publish stays off (`auto_publish_enabled = false`) until quality is proven. When a publisher selects scheduled or gated auto, passing drafts are staggered through existing `publishing_schedules`.
- Vault multi-key rotation shipped in the operational closeout. The env key remains last-resort fallback.

#### Phase 6 schema

Additive remote migrations `phase6_durable_generation` and `phase6_media_job_fk_indexes` (21 application tables): `generation_jobs` gained cancel, backoff, lock, and cost columns; `generation_batches.cancel_requested`; new `generation_media_jobs` with ENABLE + FORCE RLS and the same `app.can_access_batch` policies as jobs. Anon still has no grants on generation, media-job, or secret tables. Claim RPCs are not executable by `anon` or `authenticated`.

#### Phase 6 routes

- `/admin/generate` — direction form, 5–15 title ideas, provider health (super admin), recent batches. `noindex`.
- `/admin/generate/[id]` — multi-select titles, queue independent jobs, live progress, cancel remaining, retry failed article or illustration jobs. `noindex`. `maxDuration` 300.
- `/api/cron/generate` — service worker tick. 401 without `Authorization: Bearer CRON_SECRET`.
- Public converter and blog routes unchanged. Blog stays out of the primary header.

#### Phase 6 verification

- `npx tsc --noEmit` passed after the durable worker, media jobs, and Generate UI landed.
- Remote migrations applied to AllYouConvert: `generation_media_jobs` present with FORCE RLS; hourly limit 24; concurrency 2/2; stale 300s; auto-publish false.
- Security advisor: no new findings (existing Auth leaked-password WARN unchanged). Performance advisor: unused-index INFO on a quiet database (indexes kept). Covering indexes added for `generation_media_jobs` foreign keys.
- Grants: `anon` has no privileges on `generation_batches`, `generation_jobs`, `generation_media_jobs`, or `integration_secret_refs`. Claim functions execute for `service_role` (and owner) only.
- Unauthenticated `/admin/generate` and `/admin/generate/[id]` redirected to login with `next=`. `/api/cron/generate` returned 401 `{"error":"Unauthorized"}` without a secret. Homepage primary nav stays converter categories; Blog remains footer-only. Latest guides still render before FAQ.
- A signed-in 5–15 title-to-queue click-through was not available in this session. The Google env key is present locally for a later staff test.

#### Phase 6 follow-up (does not block Phase 7)

- Run a logged-in batch of several titles and confirm independent job progress, cancel, retry, media jobs, and audit events `generation.enqueue` / `generation.article` / `generation.media` / `generation.cancel`.
- Secure multi-key rotation and failover in Supabase Vault shipped in the operational closeout.
- Set `CRON_SECRET` on Vercel if it is not already present for the publish cron. The admin dashboard warns when it is missing.
- Optional AI Gateway routing remains later work.

### Phase 7 — editorial quality and growth

Status: complete  
Completed: 2026-10-03

- add similarity detection, intent collision checks, fact validation, and editorial review;
- add visual similarity, contrast, alt-text, brand-consistency, and media performance checks;
- add internal-link suggestions based on tools and content clusters;
- connect Search Console and privacy-safe product conversion metrics;
- tune article types, cadence, ads, and model profiles using real outcomes;
- add rollback and alerting for publishing or ad failures.

Acceptance: growth decisions use quality, search, and converter data rather than article count alone.

#### Phase 7 decisions

- Deterministic quality runs on publish, schedule, generation save, and an editor scan. Jaccard similarity on title/body tokens plus shared-tool title overlap blocks near-duplicates. Fact checks use the local tool catalog and reject in-browser claims for `vps` tools plus unsupported privacy language.
- Optional AI editorial review uses the seeded `editorial_review` / `gemini-3.8-flash` profile. A `hold` verdict writes an operational alert; it does not auto-publish.
- Cover checks use branded palettes for WCAG contrast, alt-text length, file-size limits, template membership, and repeated template+palette combinations. Template and AI covers store `palette:motif:hero` in `media_assets.variant`, chosen from a post/slug seed so live covers do not all share `paper:rule`.
- Internal-link suggestions come from catalog clusters and published posts that share tools or topics. Editors can insert them as a list block after the stored draft is saved.
- Product metrics are path-level daily counters. `/api/metrics/event` allowlists `guide_view`, `tool_start`, and `guide_tool_click`, rejects `/admin` paths, and increments through `public.increment_content_metric` (service_role only). Guide views and guide-to-tool clicks are stored on the guide path. Session storage prevents repeat `guide_view` / `tool_start` counts in one browser session. Search Console is a super-admin CSV ingest of page/date/impressions/clicks only. Writes honor `growth_metrics_enabled`.
- Rollback takes a live or scheduled guide offline (`archived` + `noindex`) and records `post.rollback`. Schedule failures and inactive-ad assignments write `operational_alerts`.

#### Phase 7 schema

Additive remote migrations `phase7_editorial_quality` and `phase7_metric_increment` (24 application tables): `content_quality_reports`, `content_metrics_daily`, `operational_alerts`. ENABLE + FORCE RLS. Anon has no grants. Authenticated reads are staff/CMS scoped; metric table writes are super-admin in RLS. Product increments use `app`/`public.increment_content_metric` with execute granted only to `service_role`. Settings: `quality_similarity_threshold = 0.42`, `growth_metrics_enabled = true`.

#### Phase 7 routes

- `/admin/growth` — 14-day metric totals, cadence notes, GSC ingest (super admin), open alerts, recent quality scores. `noindex`.
- `/admin/posts/[id]` — quality panel: scan, AI review, insert links, take live guide offline.
- `/api/metrics/event` — POST only; 40 requests/minute/IP; allowlisted keys and paths; no `/admin`.
- Publish cron also scans for inactive creatives on live assignments.

#### Phase 7 verification

- `npx tsc --noEmit` passed after quality, metrics, growth UI, increment RPC, and generation wiring.
- Remote migrations applied to AllYouConvert: three new tables with ENABLE + FORCE RLS; anon has no table privileges; `increment_content_metric` execute is `service_role` only; settings `quality_similarity_threshold = 0.42` and `growth_metrics_enabled = true`.
- Security advisor: no new findings (existing Auth leaked-password WARN unchanged). Performance advisor: unused-index INFO on a quiet database (indexes kept).
- `POST /api/metrics/event` returned 400 for an unknown key, `{ok:false}` for `/admin/posts` and a converter path used as `guide_view`, and `{ok:true}` for `/blog/convert-png-to-jpg-in-the-browser` `guide_view`. The matching `content_metrics_daily` row was written as source `product`.
- Unauthenticated `/admin/growth` redirected to `/admin/login?next=%2Fadmin%2Fgrowth`. `/api/cron/publish` returned 401 without a secret.
- Homepage primary nav stays converter categories; Blog remains footer-only. Latest guides still render before FAQ. The PNG guide keeps related-tool cards and an `Open the tool` CTA.

#### Phase 7 follow-up

- Connect a live Search Console property OAuth if CSV ingest becomes too manual.
- Run a logged-in quality scan plus AI review on a real draft and confirm `post.editorial_review` audit events.
- Staff TOTP enrollment remains a person-at-keyboard action. The dashboard now warns when the session is still `aal1`.
- `CRON_SECRET` must still be present on Vercel for production ticks. The dashboard warns when it is missing in the current runtime.

### Operational closeout — 2026-10-03

Shipped after Phase 7 so the documented follow-ups are in code:

- `/admin/media` lists blog Storage assets, supports upload, alt/focal edits, publisher approval, unused-file delete, and attaching a library cover from the post editor.
- Super admins store a new Google key through `vault.create_secret`. `integration_secret_refs` keeps `vault:<uuid>` plus a masked suffix. The adapter selects the highest-priority active key, then falls back to `GOOGLE_GENERATIVE_AI_API_KEY`. Previous keys remain failover until deactivated. RPCs execute for `service_role` only.
- `/blog/topic/[slug]` is indexable only when a public topic has at least two published, indexable guides. Thin topics stay `?topic=` and `noindex`. Sitemap includes qualifying topic URLs only.
- Local/hosted Auth config locks public signup (`enable_signup = false` in `supabase/config.toml`). The app still has no signup UI.

Verification: `npx tsc --noEmit` passed. Unauthenticated `/admin/media` redirected to `/admin/login?next=%2Fadmin%2Fmedia`. `/blog/topic/tutorials` 404s because each launch topic still has one guide. `/sitemap.xml` includes the three launch guides and no `/blog/topic/` URLs. Vault RPCs execute for `postgres` and `service_role` only. Security advisor still only reports the existing Auth leaked-password WARN.

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

Operate Phase 7 with real batches: scan drafts before publish, ingest page-level Search Console totals when available, and use `/admin/growth` rather than article count to choose the next topic cluster. Keep Blog out of the primary header. Enroll TOTP on the administrator account and confirm `CRON_SECRET` is set on Vercel.
