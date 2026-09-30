import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { ToolDef } from "@/lib/tools";

type Props = { tool: ToolDef };

export function ToolCard({ tool }: Props) {
  return (
    <Link
      href={`/${tool.slug}`}
      className="group flex flex-col gap-1 rounded-card border border-line bg-paper px-4 py-3.5 shadow-sm transition duration-180 hover:-translate-y-0.5 hover:border-accent hover:shadow-drop"
    >
      <p className="flex items-center gap-2 font-medium text-ink">
        {tool.title}
        {tool.need === "vps" ? <Badge tone="warn">soon</Badge> : null}
      </p>
      <p className="text-sm leading-5 text-mute">{tool.purpose}</p>
    </Link>
  );
}
