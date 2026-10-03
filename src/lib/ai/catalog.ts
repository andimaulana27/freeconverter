import { getTool, tools, type ToolDef } from "@/lib/tools";

export type ToolFact = {
  slug: string;
  title: string;
  category: string;
  purpose: string;
  need: ToolDef["need"];
  inputs: string[];
  output: string;
  href: string;
  browser: boolean;
};

export function toolFact(slug: string): ToolFact | null {
  const tool = getTool(slug);
  if (!tool) return null;
  return {
    slug: tool.slug,
    title: tool.title,
    category: tool.category,
    purpose: tool.purpose,
    need: tool.need,
    inputs: tool.inputs,
    output: tool.output,
    href: `/${tool.slug}`,
    browser: tool.need === "browser",
  };
}

export function toolFacts(slugs: string[]) {
  return [...new Set(slugs)].flatMap((slug) => {
    const fact = toolFact(slug);
    return fact ? [fact] : [];
  });
}

export function compactCatalog(limit = 90) {
  return tools
    .filter((tool) => tool.v1)
    .slice(0, limit)
    .map((tool) => `${tool.slug} | ${tool.title} | ${tool.need} | ${tool.inputs.join(",")}>${tool.output}`);
}

export function productGrounding() {
  return [
    "AllYouConvert is a file conversion site. Many tools run entirely in the browser.",
    "If a tool's need is browser, files are processed on-device and are not uploaded to AllYouConvert servers.",
    "If a tool's need is vps, processing uses the dedicated worker that is part of AllYouConvert. Do not describe those tools as in-browser, and do not say the worker is missing.",
    "Never invent formats, file-size limits, encryption, HIPAA, or legal guarantees.",
    "Internal links must be same-site paths such as /png-to-jpg. Never link to /admin.",
    "Do not write near-duplicate titles for existing guides.",
  ].join(" ");
}
