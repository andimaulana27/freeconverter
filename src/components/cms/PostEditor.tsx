"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveCover,
  changePostStatus,
  generateAiIllustrationCover,
  generateTemplateCover,
  removeCover,
  saveDraft,
  updateCoverMeta,
  uploadCover,
} from "@/app/admin/posts/actions";
import { BlockEditor, blocksFromBody, toBlogBlocks, type DraftBlock } from "@/components/cms/BlockEditor";
import { StatusBadge } from "@/components/cms/StatusBadge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SEO_LIMITS, validateForPublish } from "@/lib/cms/quality";
import { slugify } from "@/lib/cms/slug";
import type { CatalogTool, CmsPost, CmsSchedule, CmsTopic, EditorPayload } from "@/lib/cms/types";

type SaveState = "saved" | "dirty" | "saving" | "conflict" | "error";

function payloadFrom(draft: {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  topicId: string;
  toolSlugs: string[];
  noindex: boolean;
  blocks: DraftBlock[];
}): EditorPayload {
  return {
    title: draft.title,
    slug: draft.slug,
    excerpt: draft.excerpt,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
    topicId: draft.topicId || null,
    toolSlugs: draft.toolSlugs,
    noindex: draft.noindex,
    body: { version: 1, blocks: toBlogBlocks(draft.blocks) },
  };
}

function draftFrom(post: CmsPost) {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    seoTitle: post.seo_title ?? "",
    seoDescription: post.seo_description ?? "",
    topicId: post.topic_id ?? "",
    toolSlugs: post.tool_slugs,
    noindex: post.noindex,
    blocks: blocksFromBody(post.body.blocks),
  };
}

function inputClass() {
  return "h-10 w-full rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent focus:shadow-glow";
}

export function PostEditor({
  post: initialPost,
  topics,
  tools,
  canPublish,
  schedule,
}: {
  post: CmsPost;
  topics: CmsTopic[];
  tools: CatalogTool[];
  canPublish: boolean;
  schedule: CmsSchedule | null;
}) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [draft, setDraft] = useState(() => draftFrom(initialPost));
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [message, setMessage] = useState("");
  const [toolQuery, setToolQuery] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [coverAlt, setCoverAlt] = useState(initialPost.cover?.alt_text ?? "");
  const [busy, setBusy] = useState(false);
  const skipAutosave = useRef(true);

  useEffect(() => {
    skipAutosave.current = true;
    setPost(initialPost);
    setDraft(draftFrom(initialPost));
    setCoverAlt(initialPost.cover?.alt_text ?? "");
    setSaveState("saved");
  }, [initialPost]);

  const payload = useMemo(() => payloadFrom(draft), [draft]);
  const issues = useMemo(
    () =>
      validateForPublish({
        title: payload.title,
        slug: payload.slug,
        excerpt: payload.excerpt,
        seoTitle: payload.seoTitle,
        seoDescription: payload.seoDescription,
        body: payload.body,
        toolSlugs: payload.toolSlugs,
        cover: post.cover,
      }),
    [payload, post.cover],
  );

  useEffect(() => {
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    setSaveState("dirty");
    const timer = window.setTimeout(() => {
      void persist(false);
    }, 2200);
    return () => window.clearTimeout(timer);
    // persist is stable enough via refs of latest draft through closure; we retrigger on draft
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  async function persist(createRevision: boolean) {
    setSaveState("saving");
    const result = await saveDraft({
      postId: post.id,
      expectedUpdatedAt: post.updated_at,
      payload,
      createRevision,
    });
    if (!result.ok) {
      setSaveState(result.code === "conflict" ? "conflict" : "error");
      setMessage(result.error);
      if (result.post) setPost(result.post);
      return result;
    }
    skipAutosave.current = true;
    setPost(result.post);
    setSaveState("saved");
    setMessage(createRevision ? "Revision saved." : "");
    router.refresh();
    return result;
  }

  async function runStatus(action: Parameters<typeof changePostStatus>[0]["action"], extra?: { runAt?: string; scheduleAction?: "publish" | "unpublish" }) {
    setBusy(true);
    setMessage("");
    const result = await changePostStatus({
      postId: post.id,
      expectedUpdatedAt: post.updated_at,
      payload,
      action,
      runAt: extra?.runAt,
      scheduleAction: extra?.scheduleAction,
    });
    setBusy(false);
    if (!result.ok) {
      setSaveState(result.code === "conflict" ? "conflict" : "error");
      setMessage(result.error);
      if (result.post) setPost(result.post);
      return;
    }
    skipAutosave.current = true;
    setPost(result.post);
    setDraft(draftFrom(result.post));
    setSaveState("saved");
    setMessage(result.message ?? "Updated.");
    router.refresh();
  }

  async function onUpload(file: File) {
    setBusy(true);
    const data = new FormData();
    data.set("postId", post.id);
    data.set("expectedUpdatedAt", post.updated_at);
    data.set("altText", coverAlt || `Cover for ${draft.title}`);
    data.set("file", file);
    const result = await uploadCover(data);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    skipAutosave.current = true;
    setPost(result.post);
    setCoverAlt(result.post.cover?.alt_text ?? coverAlt);
    router.refresh();
  }

  const matches = tools.filter((tool) => {
    if (draft.toolSlugs.includes(tool.slug)) return false;
    const q = toolQuery.trim().toLowerCase();
    if (!q) return false;
    return tool.slug.includes(q) || tool.title.toLowerCase().includes(q) || tool.category.toLowerCase().includes(q);
  }).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-micro uppercase text-faint">Structured editor</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{draft.title || "Untitled guide"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-mute">
            <StatusBadge status={post.status} />
            <span>
              {saveState === "saving" ? "Saving…" : saveState === "dirty" ? "Unsaved changes" : saveState === "conflict" ? "Conflict" : "Saved"}
            </span>
            {schedule ? <span>Scheduled {new Date(schedule.run_at).toISOString().slice(0, 16)} UTC · {schedule.action}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/admin/posts/${post.id}/preview`} variant="secondary" size="sm">
            Preview
          </ButtonLink>
          <ButtonLink href={`/admin/posts/${post.id}/revisions`} variant="secondary" size="sm">
            Revisions
          </ButtonLink>
          <Button type="button" variant="secondary" size="sm" loading={busy} onClick={() => void persist(true)}>
            Save revision
          </Button>
        </div>
      </div>

      {message ? (
        <p role={saveState === "error" || saveState === "conflict" ? "alert" : "status"} className="rounded-control border border-line bg-bone px-3 py-2 text-sm">
          {message}{" "}
          {saveState === "conflict" ? (
            <button type="button" className="font-semibold text-accent" onClick={() => router.refresh()}>
              Reload
            </button>
          ) : null}
        </p>
      ) : null}

      <section className="grid gap-4 rounded-tile border border-line bg-paper p-5 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-mute lg:col-span-2">
          Title
          <input className={inputClass()} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-mute">
          Slug
          <input
            className={inputClass()}
            value={draft.slug}
            onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-mute">
          Topic
          <select className={inputClass()} value={draft.topicId} onChange={(event) => setDraft({ ...draft, topicId: event.target.value })}>
            <option value="">None</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-mute lg:col-span-2">
          Excerpt
          <textarea
            className="w-full rounded-control border border-line bg-bone px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:shadow-glow"
            rows={3}
            value={draft.excerpt}
            onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })}
          />
          <span className="text-[11px] text-faint">{draft.excerpt.trim().length}/{SEO_LIMITS.excerpt.max}</span>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-mute">
          SEO title
          <input className={inputClass()} value={draft.seoTitle} onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} />
          <span className="text-[11px] text-faint">{(draft.seoTitle || draft.title).trim().length}/{SEO_LIMITS.seoTitle.max}</span>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-mute">
          Meta description
          <input className={inputClass()} value={draft.seoDescription} onChange={(event) => setDraft({ ...draft, seoDescription: event.target.value })} />
          <span className="text-[11px] text-faint">{(draft.seoDescription || draft.excerpt).trim().length}/{SEO_LIMITS.seoDescription.max}</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-mute lg:col-span-2">
          <input type="checkbox" checked={draft.noindex} onChange={(event) => setDraft({ ...draft, noindex: event.target.checked })} />
          Keep this guide noindex after publish
        </label>
      </section>

      <section className="rounded-tile border border-line bg-paper p-5">
        <h2 className="text-sm font-semibold">Related tools</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {draft.toolSlugs.map((slug) => (
            <button
              key={slug}
              type="button"
              className="rounded-control border border-line px-2 py-1 text-xs"
              onClick={() => setDraft({ ...draft, toolSlugs: draft.toolSlugs.filter((item) => item !== slug) })}
            >
              {slug} ×
            </button>
          ))}
        </div>
        <input
          className={`${inputClass()} mt-3 max-w-md`}
          placeholder="Search tools"
          value={toolQuery}
          onChange={(event) => setToolQuery(event.target.value)}
        />
        {matches.length ? (
          <ul className="mt-2 max-w-md divide-y divide-line rounded-control border border-line">
            {matches.map((tool) => (
              <li key={tool.slug}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-bone"
                  onClick={() => {
                    setDraft({ ...draft, toolSlugs: [...draft.toolSlugs, tool.slug] });
                    setToolQuery("");
                  }}
                >
                  <span>{tool.title}</span>
                  <span className="text-xs text-faint">{tool.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-tile border border-line bg-paper p-5">
        <h2 className="text-sm font-semibold">Cover</h2>
        <p className="mt-1 text-sm text-mute">Upload, generate a branded template, or add an optional text-free AI illustration behind the title.</p>
        {post.cover ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover.url} alt={post.cover.alt_text || draft.title} className="aspect-[1.91/1] w-full rounded-card border border-line object-cover" />
            <div className="space-y-3">
              <p className="text-xs text-mute">
                {post.cover.source} · {post.cover.approved_at ? "Approved" : "Needs approval"}
              </p>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-mute">
                Alt text
                <input className={inputClass()} value={coverAlt} onChange={(event) => setCoverAlt(event.target.value)} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-mute">
                  Focal X {post.cover.focal_x}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={post.cover.focal_x}
                    onChange={(event) => {
                      void updateCoverMeta({
                        postId: post.id,
                        expectedUpdatedAt: post.updated_at,
                        altText: coverAlt,
                        focalX: Number(event.target.value),
                        focalY: post.cover?.focal_y ?? 0.5,
                      }).then((result) => result.ok && setPost(result.post));
                    }}
                  />
                </label>
                <label className="text-xs text-mute">
                  Focal Y {post.cover.focal_y}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={post.cover.focal_y}
                    onChange={(event) => {
                      void updateCoverMeta({
                        postId: post.id,
                        expectedUpdatedAt: post.updated_at,
                        altText: coverAlt,
                        focalX: post.cover?.focal_x ?? 0.5,
                        focalY: Number(event.target.value),
                      }).then((result) => result.ok && setPost(result.post));
                    }}
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    void updateCoverMeta({
                      postId: post.id,
                      expectedUpdatedAt: post.updated_at,
                      altText: coverAlt,
                      focalX: post.cover?.focal_x ?? 0.5,
                      focalY: post.cover?.focal_y ?? 0.5,
                    }).then((result) => {
                      if (result.ok) setPost(result.post);
                      else setMessage(result.error);
                    })
                  }
                >
                  Save alt / focal point
                </Button>
                {canPublish && !post.cover.approved_at ? (
                  <Button type="button" size="sm" onClick={() => void approveCover({ postId: post.id, expectedUpdatedAt: post.updated_at }).then((result) => result.ok && setPost(result.post))}>
                    Approve
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" size="sm" onClick={() => void removeCover({ postId: post.id, expectedUpdatedAt: post.updated_at }).then((result) => result.ok && setPost(result.post))}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center rounded-control border border-line bg-paper px-4 text-sm">
            Upload
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onUpload(file);
                event.target.value = "";
              }}
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={busy}
            onClick={() =>
              void generateTemplateCover({ postId: post.id, expectedUpdatedAt: post.updated_at, title: draft.title }).then((result) => {
                if (!result.ok) {
                  setMessage(result.error);
                  return;
                }
                skipAutosave.current = true;
                setPost(result.post);
                setCoverAlt(result.post.cover?.alt_text ?? coverAlt);
              })
            }
          >
            Auto template
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={busy}
            onClick={() =>
              void generateAiIllustrationCover({
                postId: post.id,
                expectedUpdatedAt: post.updated_at,
                title: draft.title,
              }).then((result) => {
                if (!result.ok) {
                  setMessage(result.error);
                  return;
                }
                skipAutosave.current = true;
                setPost(result.post);
                setCoverAlt(result.post.cover?.alt_text ?? coverAlt);
              })
            }
          >
            AI illustration
          </Button>
        </div>
      </section>

      <section className="rounded-tile border border-line bg-paper p-5">
        <h2 className="text-sm font-semibold">Body</h2>
        <div className="mt-4">
          <BlockEditor blocks={draft.blocks} onChange={(blocks) => setDraft({ ...draft, blocks })} />
        </div>
      </section>

      <section className="rounded-tile border border-line bg-paper p-5">
        <h2 className="text-sm font-semibold">Quality gate</h2>
        {issues.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mute">
            {issues.map((issue) => (
              <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ok">Ready to publish.</p>
        )}
      </section>

      <section className="rounded-tile border border-line bg-paper p-5">
        <h2 className="text-sm font-semibold">Publishing</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {post.status !== "review" ? (
            <Button type="button" variant="secondary" loading={busy} onClick={() => void runStatus("review")}>
              Submit for review
            </Button>
          ) : (
            <Button type="button" variant="secondary" loading={busy} onClick={() => void runStatus("draft")}>
              Return to draft
            </Button>
          )}
          {canPublish ? (
            <>
              <Button type="button" loading={busy} onClick={() => void runStatus("publish")}>
                Publish now
              </Button>
              {post.status === "published" || post.status === "scheduled" ? (
                <Button type="button" variant="secondary" loading={busy} onClick={() => void runStatus("unpublish")}>
                  Unpublish
                </Button>
              ) : (
                <Button type="button" variant="secondary" loading={busy} onClick={() => void runStatus("archive")}>
                  Archive
                </Button>
              )}
              {post.status === "scheduled" ? (
                <Button type="button" variant="ghost" loading={busy} onClick={() => void runStatus("cancel_schedule")}>
                  Cancel schedule
                </Button>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-mute">Publishing is limited to editors and super admins.</p>
          )}
        </div>
        {canPublish ? (
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-mute">
              Schedule (local time)
              <input className={inputClass()} type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} />
            </label>
            <Button type="button" variant="secondary" loading={busy} onClick={() => void runStatus("schedule", { runAt: scheduleAt, scheduleAction: "publish" })}>
              Schedule publish
            </Button>
            {post.status === "published" ? (
              <Button type="button" variant="ghost" loading={busy} onClick={() => void runStatus("schedule", { runAt: scheduleAt, scheduleAction: "unpublish" })}>
                Schedule unpublish
              </Button>
            ) : null}
          </div>
        ) : null}
        {post.status === "published" ? (
          <p className="mt-3 text-sm">
            Live at <Link href={`/blog/${post.slug}`} className="text-accent">/blog/{post.slug}</Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}
