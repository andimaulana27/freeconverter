import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { toolBlurb, type ToolDef } from "@/lib/tools";

type Props = { tool: ToolDef };

export function ToolCard({ tool }: Props) {
  return (
    <Link
      href={`/${tool.slug}`}
      className="group flex flex-col gap-1 border-b border-line py-4 transition duration-180 hover:border-accent"
    >
      <p className="flex items-center gap-2 font-medium text-ink">
        {tool.title}
        {tool.need === "vps" ? <Badge tone="warn">soon</Badge> : null}
      </p>
      <p className="text-sm leading-5 text-mute">{toolBlurb(tool)}</p>
    </Link>
  );
}
