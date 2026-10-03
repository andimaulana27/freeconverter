"use server";

import { canManageSecrets } from "@/lib/auth/roles";
import { requireCms, requireStaff } from "@/lib/auth/session";
import { createTitleBatch, enforceGenerationBudget, generateSelectedArticle, saveTitleSelections } from "@/lib/ai/pipeline";
import { assertGenerationAvailable, readGenerationHealth, testGoogleConnection } from "@/lib/ai/secrets";
import { fetchBatch } from "@/lib/ai/server";
import { ARTICLE_TYPES, type ArticleType, type GenerationActionResult, type TitleCandidate } from "@/lib/ai/types";
import { filterKnownToolSlugs } from "@/lib/ai/validate";
import { sanitizeAiError } from "@/lib/ai/provider";

function asArticleType(value: string): ArticleType {
  return ARTICLE_TYPES.includes(value as ArticleType) ? (value as ArticleType) : "tool_tutorial";
}

export async function createTitleBatchAction(input: {
  topic: string;
  articleType: string;
  direction: string;
  audience: string;
  language: string;
  tone: string;
  titleCount: number;
  targetToolSlugs: string[];
  includeIllustration: boolean;
}): Promise<GenerationActionResult> {
  const session = await requireCms("/admin/generate");
  const available = await assertGenerationAvailable(session.supabase, session.role);
  if (!available.ok) return available;
  const budget = await enforceGenerationBudget(session.supabase, session.user.id, 0);
  if (!budget.ok) return budget;
  try {
    const result = await createTitleBatch({
      client: session.supabase,
      role: session.role,
      actorId: session.user.id,
      topic: input.topic,
      articleType: asArticleType(input.articleType),
      direction: input.direction,
      audience: input.audience,
      language: input.language,
      tone: input.tone,
      titleCount: input.titleCount,
      targetToolSlugs: filterKnownToolSlugs(input.targetToolSlugs),
      includeIllustration: input.includeIllustration,
    });
    return result;
  } catch (error) {
    return { ok: false, error: sanitizeAiError(error) };
  }
}

export async function saveTitlesAction(input: {
  batchId: string;
  titles: TitleCandidate[];
  selectedIndex: number | null;
  includeIllustration: boolean;
}): Promise<GenerationActionResult> {
  const session = await requireCms(`/admin/generate/${input.batchId}`);
  const batch = await fetchBatch(session.supabase, input.batchId);
  if (!batch) return { ok: false, error: "Batch not found." };
  await saveTitleSelections({
    client: session.supabase,
    batchId: input.batchId,
    titles: input.titles,
    selectedIndex: input.selectedIndex,
    includeIllustration: input.includeIllustration,
  });
  return { ok: true, batchId: input.batchId };
}

export async function generateArticleAction(input: {
  batchId: string;
  selectedIndex: number;
  titles: TitleCandidate[];
  includeIllustration: boolean;
}): Promise<GenerationActionResult> {
  const session = await requireCms(`/admin/generate/${input.batchId}`);
  const available = await assertGenerationAvailable(session.supabase, session.role);
  if (!available.ok) return available;
  const budget = await enforceGenerationBudget(session.supabase, session.user.id, 1);
  if (!budget.ok) return budget;
  await saveTitleSelections({
    client: session.supabase,
    batchId: input.batchId,
    titles: input.titles,
    selectedIndex: input.selectedIndex,
    includeIllustration: input.includeIllustration,
  });
  try {
    return await generateSelectedArticle({
      client: session.supabase,
      role: session.role,
      actorId: session.user.id,
      batchId: input.batchId,
      selectedIndex: input.selectedIndex,
    });
  } catch (error) {
    return { ok: false, error: sanitizeAiError(error) };
  }
}

export async function testGoogleConnectionAction(): Promise<GenerationActionResult> {
  const session = await requireStaff("/admin/generate");
  if (!canManageSecrets(session.role)) return { ok: false, error: "Only a super admin can test the provider key.", code: "forbidden" };
  const result = await testGoogleConnection({
    client: session.supabase,
    role: session.role,
    actorId: session.user.id,
  });
  if (!result.ok) return result;
  const health = await readGenerationHealth(session.supabase, session.role);
  return { ok: true, message: result.message, health };
}
