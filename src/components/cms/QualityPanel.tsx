"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  applySuggestedLinks,
  rollbackPublishedGuide,
  runAiEditorialReview,
  runQualityScan,
} from "@/app/admin/posts/actions";
import { Button } from "@/components/ui/Button";
import type { EditorialReport } from "@/lib/cms/editorial";
import type { CmsPost, QualityIssue, QualityReportRow } from "@/lib/cms/types";

export function QualityPanel({
  post,
  initialReport,
  canPublish,
  editorDirty = false,
}: {
  post: CmsPost;
  initialReport: QualityReportRow | null;
  canPublish: boolean;
  editorDirty?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<EditorialReport | null>(findingsToReport(initialReport));
  const editorial = initialReport?.editorial as { verdict?: string; summary?: string } | null;

  async function scan() {
    setBusy(true);
    setMessage("");
    const result = await runQualityScan(post.id);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setReport(result.report);
    setMessage(`Quality score ${result.report.score}.`);
    router.refresh();
  }

  async function review() {
    setBusy(true);
    setMessage("");
    const result = await runAiEditorialReview(post.id);
    setBusy(false);
    setMessage(result.ok ? `Editorial verdict: ${result.editorial.verdict}. ${result.editorial.summary}` : result.error);
    if (result.ok) router.refresh();
  }

  async function insertLinks() {
    if (editorDirty) {
      setMessage("Save the current draft before inserting link suggestions.");
      return;
    }
    setBusy(true);
    setMessage("");
    const result = await applySuggestedLinks({ postId: post.id, expectedUpdatedAt: post.updated_at });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage("Inserted internal-link suggestions as a list block.");
    router.refresh();
  }

  async function rollback() {
    setBusy(true);
    setMessage("");
    const result = await rollbackPublishedGuide(post.id);
    setBusy(false);
    setMessage(result.ok ? result.message ?? "Guide taken offline." : result.error);
    if (result.ok) router.refresh();
  }

  return (
    <section className="rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-tile sm:p-6">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Editorial quality</p>
      <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">Similarity, facts, visuals, and links</h2>
      <p className="mt-1 text-xs text-mute">
        Score {report?.score ?? initialReport?.score ?? "—"}. Blocking issues hold publish; warnings guide the next edit.
      </p>
      {report?.similar.length ? (
        <ul className="mt-3 space-y-1 text-sm text-mute">
          {report.similar.map((hit) => (
            <li key={hit.id}>
              {hit.reason === "intent" ? "Intent" : "Overlap"} with {hit.title} ({Math.round(hit.score * 100)}%)
            </li>
          ))}
        </ul>
      ) : null}
      {report?.visual.contrastInk ? (
        <p className="mt-2 text-xs text-mute">
          Cover contrast {report.visual.contrastInk.toFixed(1)}:1 title, {(report.visual.contrastAccent ?? 0).toFixed(1)}:1 accent
          {report.visual.template ? ` · ${report.visual.template}` : ""}
        </p>
      ) : null}
      {report?.links.length ? (
        <ul className="mt-3 space-y-1 text-sm text-mute">
          {report.links.slice(0, 6).map((link) => (
            <li key={link.href}>
              {link.title} → {link.href} ({link.reason})
            </li>
          ))}
        </ul>
      ) : null}
      <IssueList label="Holds" issues={report?.blocking ?? []} />
      <IssueList label="Warnings" issues={report?.warnings ?? []} />
      {editorial?.verdict ? <p className="mt-3 text-sm text-mute">Last AI review: {editorial.verdict}. {editorial.summary}</p> : null}
      {message ? <p className="mt-3 text-sm text-mute">{message}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" loading={busy} onClick={() => void scan()}>
          Run quality scan
        </Button>
        <Button type="button" variant="secondary" size="sm" loading={busy} onClick={() => void review()}>
          AI editorial pass
        </Button>
        <Button type="button" variant="secondary" size="sm" loading={busy} onClick={() => void insertLinks()}>
          Insert link suggestions
        </Button>
        {canPublish ? (
          <Button type="button" variant="secondary" size="sm" loading={busy} onClick={() => void rollback()}>
            Take live guide offline
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function IssueList({ label, issues }: { label: string; issues: QualityIssue[] }) {
  if (!issues.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">{label}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-mute">
        {issues.map((issue) => (
          <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
        ))}
      </ul>
    </div>
  );
}

function findingsToReport(row: QualityReportRow | null): EditorialReport | null {
  if (!row) return null;
  const findings = row.findings ?? {};
  return {
    score: row.score,
    blocking: Array.isArray(findings.blocking) ? (findings.blocking as QualityIssue[]) : [],
    warnings: Array.isArray(findings.warnings) ? (findings.warnings as QualityIssue[]) : [],
    similar: Array.isArray(findings.similar) ? (findings.similar as EditorialReport["similar"]) : [],
    links: Array.isArray(findings.links) ? (findings.links as EditorialReport["links"]) : [],
    visual: (findings.visual as EditorialReport["visual"]) ?? { contrastInk: null, contrastAccent: null, palette: null, template: null },
  };
}
