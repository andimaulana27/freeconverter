import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { parseBlogBody, readingMinutesFromBody, safeGuideHref, type BlogBody } from "@/lib/blog/content";
import { getSupabasePublicKey, getSupabaseUrl, hasSupabasePublicConfig } from "@/lib/supabase/env";

export type BlogTopic = {
  slug: string;
  name: string;
};

export type BlogTopicArchive = BlogTopic & {
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  count: number;
};

export const TOPIC_ARCHIVE_MIN = 2;

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalPath: string;
  toolSlugs: string[];
  publishedAt: string;
  updatedAt: string;
  noindex: boolean;
  readingMinutes: number;
  topic: BlogTopic | null;
};

export type BlogPost = BlogPostSummary & {
  body: BlogBody;
  cover: { url: string; alt: string } | null;
};

type TopicRow = { slug?: string; name?: string } | { slug?: string; name?: string }[] | null;

type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body?: unknown;
  seo_title: string | null;
  seo_description: string | null;
  canonical_path: string | null;
  tool_slugs: string[] | null;
  published_at: string | null;
  unpublished_at: string | null;
  updated_at: string;
  noindex: boolean;
  reading_minutes: number | null;
  status: string;
  topic: TopicRow;
  cover?: {
    bucket?: string;
    path?: string;
    alt_text?: string | null;
    visibility?: string;
  } | {
    bucket?: string;
    path?: string;
    alt_text?: string | null;
    visibility?: string;
  }[] | null;
};

const LIST_COLUMNS = `
  id, slug, title, excerpt, seo_title, seo_description, canonical_path, tool_slugs,
  published_at, unpublished_at, updated_at, noindex, reading_minutes, status,
  topic:blog_topics!blog_posts_topic_id_fkey ( slug, name )
`;

const DETAIL_COLUMNS = `
  ${LIST_COLUMNS},
  body,
  cover:media_assets!blog_posts_cover_asset_id_fkey ( bucket, path, alt_text, visibility )
`;

function publicClient() {
  if (!hasSupabasePublicConfig()) return null;
  return createClient(getSupabaseUrl(), getSupabasePublicKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function topicFrom(value: TopicRow): BlogTopic | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row?.slug || !row.name) return null;
  return { slug: row.slug, name: row.name };
}

function canonicalPathFor(slug: string, canonicalPath: string | null) {
  const safe = safeGuideHref(canonicalPath);
  if (safe?.startsWith("/blog/")) return safe;
  return `/blog/${slug}`;
}

function inPublicWindow(row: PostRow, now: number) {
  if (row.status !== "published" || !row.published_at) return false;
  if (new Date(row.published_at).getTime() > now) return false;
  if (row.unpublished_at && new Date(row.unpublished_at).getTime() <= now) return false;
  return true;
}

function summaryFrom(row: PostRow, body: BlogBody | null): BlogPostSummary | null {
  if (!row.slug || !row.title || !row.published_at) return null;
  const excerpt = row.excerpt?.trim() || row.seo_description?.trim() || "";
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt,
    seoTitle: row.seo_title?.trim() || null,
    seoDescription: row.seo_description?.trim() || null,
    canonicalPath: canonicalPathFor(row.slug, row.canonical_path),
    toolSlugs: (row.tool_slugs ?? []).filter((slug) => typeof slug === "string" && slug.length > 0),
    publishedAt: row.published_at,
    updatedAt: row.updated_at || row.published_at,
    noindex: row.noindex === true,
    readingMinutes: readingMinutesFromBody(body ?? { version: 1, blocks: [] }, row.reading_minutes),
    topic: topicFrom(row.topic),
  };
}

function coverFrom(row: PostRow) {
  const cover = Array.isArray(row.cover) ? row.cover[0] : row.cover;
  if (!cover || cover.visibility !== "public" || cover.bucket !== "blog-public" || !cover.path) return null;
  const url = `${getSupabaseUrl()}/storage/v1/object/public/${cover.bucket}/${cover.path.split("/").map(encodeURIComponent).join("/")}`;
  return { url, alt: cover.alt_text?.trim() || row.title };
}

function visiblePosts(nowIso: string) {
  const supabase = publicClient();
  if (!supabase) return null;
  return supabase
    .from("blog_posts")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .lte("published_at", nowIso)
    .or(`unpublished_at.is.null,unpublished_at.gt."${nowIso}"`);
}

export const listPublishedPosts = cache(async (): Promise<BlogPostSummary[]> => {
  const nowIso = new Date().toISOString();
  const query = visiblePosts(nowIso);
  if (!query) return [];
  const { data, error } = await query.order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  const now = Date.now();
  return ((data ?? []) as PostRow[]).flatMap((row) => {
    if (!inPublicWindow(row, now)) return [];
    const summary = summaryFrom(row, null);
    return summary ? [summary] : [];
  });
});

export const getPublishedSlugRedirect = cache(async (slug: string): Promise<string | null> => {
  const supabase = publicClient();
  if (!supabase || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const { data, error } = await supabase.from("blog_slug_redirects").select("to_slug").eq("from_slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  const target = typeof data?.to_slug === "string" ? data.to_slug : null;
  if (!target) return null;
  const live = await getPublishedPost(target);
  return live ? target : null;
});

export const getPublishedPost = cache(async (slug: string): Promise<BlogPost | null> => {
  const supabase = publicClient();
  if (!supabase || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", nowIso)
    .or(`unpublished_at.is.null,unpublished_at.gt."${nowIso}"`)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as PostRow | null;
  if (!row || !inPublicWindow(row, Date.now())) return null;
  const body = parseBlogBody(row.body);
  const summary = summaryFrom(row, body);
  if (!summary) return null;
  return { ...summary, body, cover: coverFrom(row) };
});

export const getHomepageGuides = cache(async () => {
  const supabase = publicClient();
  const posts = await listPublishedPosts();
  let preferred: string[] = [];
  let limit = 3;
  if (supabase) {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .eq("is_public", true)
      .in("key", ["homepage_guide_slugs", "homepage_guide_count"]);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      if (row.key === "homepage_guide_count" && typeof row.value === "number" && row.value > 0) {
        limit = Math.min(6, row.value);
      }
      if (row.key === "homepage_guide_slugs" && Array.isArray(row.value)) {
        preferred = row.value.filter((item): item is string => typeof item === "string");
      }
    }
  }
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  const picked: BlogPostSummary[] = [];
  for (const slug of preferred) {
    const post = bySlug.get(slug);
    if (!post || picked.some((item) => item.id === post.id)) continue;
    picked.push(post);
    if (picked.length >= limit) return picked;
  }
  for (const post of posts) {
    if (picked.length >= limit) break;
    if (!picked.some((item) => item.id === post.id)) picked.push(post);
  }
  return picked;
});

export function relatedGuides(posts: BlogPostSummary[], current: BlogPostSummary, limit = 3) {
  const scored = posts.flatMap((post) => {
    if (post.id === current.id) return [];
    const sharedTool = post.toolSlugs.some((slug) => current.toolSlugs.includes(slug));
    const sharedTopic = Boolean(current.topic && post.topic?.slug === current.topic.slug);
    const score = (sharedTopic ? 2 : 0) + (sharedTool ? 1 : 0);
    return [{ post, score }];
  });
  scored.sort((a, b) => b.score - a.score || b.post.publishedAt.localeCompare(a.post.publishedAt));
  return scored.slice(0, limit).map((item) => item.post);
}

export const listPublicTopics = cache(async (): Promise<BlogTopic[]> => {
  const posts = await listPublishedPosts();
  return posts
    .flatMap((post) => (post.topic ? [post.topic] : []))
    .filter((topic, index, all) => all.findIndex((item) => item.slug === topic.slug) === index);
});

export const listTopicArchives = cache(async (): Promise<BlogTopicArchive[]> => {
  const supabase = publicClient();
  if (!supabase) return [];
  const posts = (await listPublishedPosts()).filter((post) => !post.noindex && post.topic);
  const counts = new Map<string, BlogTopicArchive>();
  for (const post of posts) {
    const topic = post.topic;
    if (!topic) continue;
    const current = counts.get(topic.slug);
    if (current) {
      current.count += 1;
      continue;
    }
    counts.set(topic.slug, {
      slug: topic.slug,
      name: topic.name,
      description: null,
      seoTitle: null,
      seoDescription: null,
      count: 1,
    });
  }
  const { data, error } = await supabase
    .from("blog_topics")
    .select("slug, name, description, seo_title, seo_description, is_public")
    .eq("is_public", true);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    const archive = counts.get(String(row.slug));
    if (!archive) continue;
    archive.name = String(row.name ?? archive.name);
    archive.description = typeof row.description === "string" ? row.description : null;
    archive.seoTitle = typeof row.seo_title === "string" ? row.seo_title : null;
    archive.seoDescription = typeof row.seo_description === "string" ? row.seo_description : null;
  }
  return [...counts.values()].filter((topic) => topic.count >= TOPIC_ARCHIVE_MIN).sort((a, b) => a.name.localeCompare(b.name));
});

export const getTopicArchive = cache(async (slug: string): Promise<BlogTopicArchive | null> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const archives = await listTopicArchives();
  return archives.find((topic) => topic.slug === slug) ?? null;
});

export async function listPublishedPostsForTopic(slug: string) {
  const posts = await listPublishedPosts();
  return posts.filter((post) => post.topic?.slug === slug);
}
