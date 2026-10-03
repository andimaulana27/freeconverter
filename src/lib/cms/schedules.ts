import "server-only";

import { evaluatePostQuality, recordAlert, saveQualityReport } from "@/lib/cms/editorial-server";
import { applyArchive, applyPublish, fetchPost, type StaffClient, writeAudit } from "@/lib/cms/server";
import type { CmsSchedule } from "@/lib/cms/types";

export async function cancelPendingSchedules(client: StaffClient, postId: string) {
  await client
    .from("publishing_schedules")
    .update({ status: "cancelled" })
    .eq("post_id", postId)
    .eq("status", "pending");
}

export async function createPublishSchedule(
  client: StaffClient,
  input: { postId: string; runAt: string; actorId: string; action: "publish" | "unpublish" },
) {
  await cancelPendingSchedules(client, input.postId);
  const { error } = await client.from("publishing_schedules").insert({
    post_id: input.postId,
    action: input.action,
    run_at: input.runAt,
    status: "pending",
    created_by: input.actorId,
  });
  if (error) throw new Error(error.message);
}

export async function processDueSchedules(client: StaffClient, actorId: string | null) {
  const { data, error } = await client
    .from("publishing_schedules")
    .select("*")
    .eq("status", "pending")
    .lte("run_at", new Date().toISOString())
    .order("run_at", { ascending: true })
    .limit(20);
  if (error) throw new Error(error.message);

  const due = (data ?? []) as CmsSchedule[];
  let processed = 0;
  const failures: string[] = [];

  for (const schedule of due) {
    const post = await fetchPost(client, schedule.post_id);
    if (!post) {
      await client
        .from("publishing_schedules")
        .update({ status: "failed", last_error: "Post not found", attempts: schedule.attempts + 1 })
        .eq("id", schedule.id);
      failures.push("Missing post");
      continue;
    }

    try {
      if (schedule.action === "publish") {
        const { issues, report } = await evaluatePostQuality(client, post);
        await saveQualityReport(client, { postId: post.id, report, actorId });
        if (issues.length) throw new Error(issues.map((issue) => issue.message).join(" "));
        await applyPublish(client, post, actorId);
      } else {
        await applyArchive(client, post, actorId);
      }

      await client
        .from("publishing_schedules")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
          attempts: schedule.attempts + 1,
          last_error: null,
        })
        .eq("id", schedule.id);
      await writeAudit(client, {
        actorId,
        action: schedule.action === "publish" ? "post.schedule_publish" : "post.schedule_unpublish",
        entityType: "blog_post",
        entityId: post.id,
        metadata: { scheduleId: schedule.id },
      });
      processed += 1;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Schedule failed";
      await client
        .from("publishing_schedules")
        .update({ status: "failed", last_error: message, attempts: schedule.attempts + 1 })
        .eq("id", schedule.id);
      await recordAlert(client, {
        kind: "schedule_failure",
        severity: "error",
        message,
        entityType: "blog_post",
        entityId: schedule.post_id,
        metadata: { scheduleId: schedule.id },
      });
      failures.push(message);
    }
  }

  return { processed, failed: failures.length };
}
