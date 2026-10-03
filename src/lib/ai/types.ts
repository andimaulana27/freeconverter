export const ARTICLE_TYPES = [
  "tool_tutorial",
  "comparison",
  "troubleshooting",
  "workflow",
  "privacy",
  "glossary",
] as const;

export type ArticleType = (typeof ARTICLE_TYPES)[number];

export const GENERATION_JOB_STAGES = [
  "queued",
  "brief",
  "outline",
  "draft",
  "seo",
  "validation",
  "review",
  "saved",
] as const;

export type GenerationJobStage = (typeof GENERATION_JOB_STAGES)[number];

export const GENERATION_JOB_STATUSES = ["pending", "running", "completed", "failed", "cancelled"] as const;
export type GenerationJobStatus = (typeof GENERATION_JOB_STATUSES)[number];

export const GENERATION_BATCH_STATUSES = ["pending", "running", "completed", "partial", "failed", "cancelled"] as const;
export type GenerationBatchStatus = (typeof GENERATION_BATCH_STATUSES)[number];

export const SECRET_HEALTH = ["unknown", "healthy", "degraded", "disabled"] as const;
export type SecretHealth = (typeof SECRET_HEALTH)[number];

export const COVER_TEMPLATES = ["brand-bar", "split-band", "quiet-grid"] as const;
export type CoverTemplate = (typeof COVER_TEMPLATES)[number];

export const COVER_PALETTES = ["paper", "ink", "bone"] as const;
export type CoverPalette = (typeof COVER_PALETTES)[number];

export const COVER_MOTIFS = ["rule", "corner", "grid"] as const;
export type CoverMotif = (typeof COVER_MOTIFS)[number];

export type TitleCandidate = {
  title: string;
  slugSuggestion: string;
  searchIntent: string;
  articleType: ArticleType;
  targetToolSlugs: string[];
  rationale: string;
  rejected: boolean;
};

export type BatchProgress = {
  direction?: string;
  audience?: string;
  language?: string;
  tone?: string;
  targetToolSlugs?: string[];
  includeIllustration?: boolean;
  titles?: TitleCandidate[];
  selectedIndex?: number;
};

export type TokenStep = {
  task: string;
  modelId: string;
  promptVersion: number | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type GenerationTrace = {
  steps: TokenStep[];
  promptVersions: Record<string, number>;
};

export type VisualBrief = {
  templateKey: CoverTemplate;
  palette: CoverPalette;
  motif: CoverMotif;
  kicker: string;
  titleLines: string[];
  altText: string;
  illustrationPrompt: string;
};

export type AiModelProfile = {
  id: string;
  task_key: string;
  provider: string;
  model_id: string;
  prompt_template_id: string | null;
  temperature: number | null;
  thinking_level: string | null;
  max_output_tokens: number | null;
  is_active: boolean;
  system_prompt: string;
  task_prompt: string;
  prompt_version: number | null;
};

export type GenerationBatch = {
  id: string;
  topic: string;
  article_type: ArticleType;
  requested_count: number;
  publishing_mode: "draft" | "scheduled" | "auto";
  status: GenerationBatchStatus;
  progress: BatchProgress;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type GenerationJob = {
  id: string;
  batch_id: string;
  title: string | null;
  outline: Record<string, unknown> | null;
  draft: Record<string, unknown> | null;
  validation: Record<string, unknown> | null;
  stage: GenerationJobStage;
  status: GenerationJobStatus;
  attempts: number;
  error: string | null;
  token_usage: GenerationTrace;
  post_id: string | null;
  created_at: string;
  updated_at: string;
};

export type GenerationHealth = {
  configured: boolean;
  health: SecretHealth | null;
  maskedSuffix: string | null;
  lastError: string | null;
  lastTestedAt: string | null;
  disabled: boolean;
};

export type GenerationActionResult =
  | { ok: true; batchId?: string; jobId?: string; postId?: string; message?: string; health?: GenerationHealth }
  | { ok: false; error: string; code?: "forbidden" | "validation" | "unconfigured" | "disabled" | "rate_limited" };

export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  tool_tutorial: "Tool tutorial",
  comparison: "Comparison",
  troubleshooting: "Troubleshooting",
  workflow: "Workflow",
  privacy: "Privacy",
  glossary: "Glossary",
};

export const TOPIC_SLUG_BY_TYPE: Record<ArticleType, string> = {
  tool_tutorial: "tutorials",
  comparison: "formats",
  troubleshooting: "troubleshooting",
  workflow: "tutorials",
  privacy: "tutorials",
  glossary: "formats",
};
