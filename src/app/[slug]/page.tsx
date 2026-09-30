import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DropEngine } from "@/components/convert/DropEngine";
import { ButtonLink } from "@/components/ui/Button";
import { getTool, tools } from "@/lib/tools";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return { title: tool.title, description: tool.purpose };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">{tool.category}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{tool.title}</h1>
      <p className="text-sm leading-6 text-mute">{tool.purpose}</p>
      <DropEngine tool={tool} />
      <ButtonLink href="/tools" className="self-start px-0 hover:bg-transparent">
        All tools
      </ButtonLink>
    </div>
  );
}
