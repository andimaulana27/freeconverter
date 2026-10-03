import Link from "next/link";
import { adSplitIndex, type BlogBlock } from "@/lib/blog/content";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M2 8h11m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Block({ block }: { block: BlogBlock }) {
  if (block.type === "paragraph") {
    return <p className="text-[15px] leading-7 text-mute">{block.text}</p>;
  }

  if (block.type === "heading") {
    const className = block.level === 2
      ? "scroll-mt-28 text-2xl font-semibold tracking-[-0.04em] text-ink"
      : "scroll-mt-28 text-lg font-semibold tracking-[-0.03em] text-ink";
    return block.level === 2 ? <h2 id={block.id} className={className}>{block.text}</h2> : <h3 id={block.id} className={className}>{block.text}</h3>;
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag className={`space-y-2 pl-5 text-[15px] leading-7 text-mute ${block.ordered ? "list-decimal" : "list-disc"}`}>
        {block.items.map((item) => <li key={item}>{item}</li>)}
      </ListTag>
    );
  }

  if (block.type === "steps") {
    return (
      <ol className="space-y-3">
        {block.items.map((item, index) => (
          <li key={item.title} className="rounded-card border border-[#e8e2df] bg-[#faf8f7] p-4">
            <p className="flex items-center gap-3 text-sm font-semibold text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent font-mono text-micro text-white">{index + 1}</span>
              {item.title}
            </p>
            <p className="mt-2 pl-10 text-sm leading-6 text-mute">{item.text}</p>
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "faq") {
    return (
      <div className="space-y-3">
        {block.items.map((item, index) => (
          <details key={item.question} className="group overflow-hidden rounded-card border border-[#e1dad6] bg-white open:border-[#cfc5c0] open:shadow-tile">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <span className="font-mono text-micro text-accent">0{index + 1}</span>
              <span className="flex-1">{item.question}</span>
              <span className="relative grid h-7 w-7 place-items-center rounded-full border border-[#e3ddda] transition group-open:rotate-45 group-open:border-accent group-open:bg-accent group-open:text-white">
                <span className="absolute h-px w-3 bg-current" />
                <span className="absolute h-3 w-px bg-current" />
              </span>
            </summary>
            <p className="border-t border-[#eee9e6] px-4 py-4 text-sm leading-6 text-mute">{item.answer}</p>
          </details>
        ))}
      </div>
    );
  }

  if (block.type === "note") {
    return <p className="rounded-card border border-accent/20 bg-accent-soft px-4 py-3 text-sm leading-6 text-ink">{block.text}</p>;
  }

  return (
    <div className="rounded-card border border-[#e8e2df] bg-white p-5 shadow-drop">
      <p className="text-sm font-semibold text-ink">{block.title}</p>
      <p className="mt-2 text-sm leading-6 text-mute">{block.text}</p>
      <Link href={block.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-accent-ink">
        {block.label}
        <ArrowIcon />
      </Link>
    </div>
  );
}

export function GuideBody({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, index) => <Block key={`${block.type}-${index}`} block={block} />)}
    </div>
  );
}

export function splitGuideBlocks(blocks: BlogBlock[]) {
  const splitAt = adSplitIndex(blocks);
  return {
    before: blocks.slice(0, splitAt),
    after: blocks.slice(splitAt),
  };
}
