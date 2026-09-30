import toolsJson from "@/data/tools.json";

export type ToolNeed = "browser" | "vps";

export type ToolDef = {
  slug: string;
  title: string;
  purpose: string;
  category: string;
  need: ToolNeed;
  engine: string;
  inputs: string[];
  output: string;
  v1: boolean;
};

export const tools = toolsJson as ToolDef[];

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug) ?? null;
}

export const categories = [...new Set(tools.map((tool) => tool.category))];

export function toolsByCategory(category: string) {
  return tools.filter((tool) => tool.category === category);
}
