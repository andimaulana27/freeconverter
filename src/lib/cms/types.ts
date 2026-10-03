import type { BlogBody } from "@/lib/blog/content";

export const POST_STATUSES = ["draft", "review", "scheduled", "published", "archived"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const MEDIA_SOURCES = ["upload", "template", "ai"] as const;
export type MediaSource = (typeof MEDIA_SOURCES)[number];

export const MEDIA_GENERATION_STATUSES = ["idle", "pending", "ready", "failed", "rejected"] as const;
export type MediaGenerationStatus = (typeof MEDIA_GENERATION_STATUSES)[number];

export const POST_MEDIA_ROLES = ["cover", "inline", "diagram", "social"] as const;
export type PostMediaRole = (typeof POST_MEDIA_ROLES)[number];

export type CmsTopic = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_public: boolean;
};

export type CmsMediaAsset = {
  id: string;
  bucket: "blog-public" | "blog-private" | "ad-creatives";
  path: string;
  mime_type: string | null;
  byte_size: number | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  visibility: "public" | "private";
  owner_id: string | null;
  source: MediaSource;
  generation_status: MediaGenerationStatus;
  provider: string | null;
  model_id: string | null;
  prompt_hash: string | null;
  seed: string | null;
  focal_x: number;
  focal_y: number;
  variant: string | null;
  template_key: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  url: string;
};

export type CmsMediaUsage = {
  postId: string;
  slug: string;
  title: string;
  role: string;
};

export type CmsMediaListItem = CmsMediaAsset & {
  usage: CmsMediaUsage[];
};

export type CmsPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: BlogBody;
  status: PostStatus;
  seo_title: string | null;
  seo_description: string | null;
  canonical_path: string | null;
  cover_asset_id: string | null;
  author_id: string | null;
  topic_id: string | null;
  tool_slugs: string[];
  current_revision_id: string | null;
  published_at: string | null;
  unpublished_at: string | null;
  scheduled_for: string | null;
  noindex: boolean;
  reading_minutes: number | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  topic: CmsTopic | null;
  cover: CmsMediaAsset | null;
  author: { user_id: string; display_name: string } | null;
};

export type CmsPostSummary = {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
  updated_at: string;
  published_at: string | null;
  scheduled_for: string | null;
  noindex: boolean;
  topic: { slug: string; name: string } | null;
};

export type CmsRevision = {
  id: string;
  post_id: string;
  snapshot: Record<string, unknown>;
  change_source: "editor" | "ai" | "restore" | "system";
  editor_id: string | null;
  restored_from_id: string | null;
  created_at: string;
};

export type CmsSchedule = {
  id: string;
  post_id: string;
  action: "publish" | "unpublish";
  run_at: string;
  status: "pending" | "processed" | "failed" | "cancelled";
  attempts: number;
  last_error: string | null;
  created_by: string | null;
  created_at: string;
  processed_at: string | null;
};

export type QualityIssue = {
  field: string;
  message: string;
  severity?: "error" | "warning";
};

export type QualityReportRow = {
  id: string;
  post_id: string;
  score: number;
  blocking_count: number;
  warning_count: number;
  findings: Record<string, unknown>;
  editorial: Record<string, unknown> | null;
  created_at: string;
};

export type MetricRow = {
  id: string;
  metric_date: string;
  path: string;
  metric_key: string;
  value: number;
  source: string;
};

export type OperationalAlert = {
  id: string;
  kind: "publish_failure" | "ad_failure" | "quality_hold" | "schedule_failure";
  severity: "info" | "warning" | "error";
  entity_type: string | null;
  entity_id: string | null;
  message: string;
  metadata: Record<string, unknown>;
  resolved_at: string | null;
  created_at: string;
};

export type EditorPayload = {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  topicId: string | null;
  toolSlugs: string[];
  noindex: boolean;
  body: BlogBody;
};

export type CmsActionResult =
  | { ok: true; post: CmsPost; message?: string }
  | {
      ok: false;
      error: string;
      code?: "conflict" | "forbidden" | "validation";
      issues?: QualityIssue[];
      post?: CmsPost;
    };

export type CatalogTool = {
  slug: string;
  title: string;
  category: string;
};
