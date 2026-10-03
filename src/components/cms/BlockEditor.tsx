"use client";

import { useMemo, useState } from "react";
import type { BlogBlock } from "@/lib/blog/content";
import { Button } from "@/components/ui/Button";

export type DraftBlock = BlogBlock & { key: string };

const TYPES: { type: DraftBlock["type"]; label: string }[] = [
  { type: "paragraph", label: "Paragraph" },
  { type: "heading", label: "Heading" },
  { type: "list", label: "List" },
  { type: "steps", label: "Steps" },
  { type: "faq", label: "FAQ" },
  { type: "note", label: "Note" },
  { type: "cta", label: "Tool CTA" },
];

function newKey() {
  return crypto.randomUUID();
}

export function emptyBlock(type: DraftBlock["type"]): DraftBlock {
  if (type === "heading") return { key: newKey(), type, level: 2, text: "", id: "section" };
  if (type === "list") return { key: newKey(), type, ordered: false, items: [""] };
  if (type === "steps") return { key: newKey(), type, items: [{ title: "", text: "" }] };
  if (type === "faq") return { key: newKey(), type, items: [{ question: "", answer: "" }] };
  if (type === "note") return { key: newKey(), type, text: "" };
  if (type === "cta") return { key: newKey(), type, title: "", text: "", href: "/", label: "Open the tool" };
  return { key: newKey(), type: "paragraph", text: "" };
}

export function blocksFromBody(blocks: BlogBlock[]): DraftBlock[] {
  return blocks.map((block, index) => ({ ...block, key: `init-${index}-${block.type}` }));
}

export function toBlogBlocks(blocks: DraftBlock[]): BlogBlock[] {
  return blocks.map((block) => {
    if (block.type === "heading") return { type: "heading", level: block.level, text: block.text, id: block.id };
    if (block.type === "paragraph") return { type: "paragraph", text: block.text };
    if (block.type === "list") return { type: "list", ordered: block.ordered, items: block.items };
    if (block.type === "steps") return { type: "steps", items: block.items };
    if (block.type === "faq") return { type: "faq", items: block.items };
    if (block.type === "note") return { type: "note", text: block.text };
    return { type: "cta", title: block.title, text: block.text, href: block.href, label: block.label };
  });
}

function Field({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  const className = "w-full rounded-control border border-line bg-bone px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:shadow-glow";
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-mute">
      {label}
      {multiline ? (
        <textarea className={className} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={className} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function BlockCard({
  block,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  block: DraftBlock;
  index: number;
  total: number;
  onChange: (block: DraftBlock) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <article className="rounded-card border border-line bg-paper p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-micro uppercase text-faint">
          {index + 1}. {block.type}
        </p>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" disabled={index === 0} onClick={() => onMove(-1)}>
            Up
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={index === total - 1} onClick={() => onMove(1)}>
            Down
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
      {block.type === "paragraph" || block.type === "note" ? (
        <Field label={block.type === "note" ? "Note" : "Paragraph"} value={block.text} multiline rows={4} onChange={(text) => onChange({ ...block, text })} />
      ) : null}
      {block.type === "heading" ? (
        <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-mute">
            Level
            <select
              className="h-10 rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent"
              value={block.level}
              onChange={(event) => onChange({ ...block, level: event.target.value === "3" ? 3 : 2 })}
            >
              <option value="2">H2</option>
              <option value="3">H3</option>
            </select>
          </label>
          <Field label="Heading" value={block.text} onChange={(text) => onChange({ ...block, text })} />
        </div>
      ) : null}
      {block.type === "list" ? (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-mute">
            <input type="checkbox" checked={block.ordered} onChange={(event) => onChange({ ...block, ordered: event.target.checked })} />
            Numbered list
          </label>
          {block.items.map((item, itemIndex) => (
            <div key={`${block.key}-item-${itemIndex}`} className="flex gap-2">
              <input
                className="h-10 flex-1 rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent"
                value={item}
                onChange={(event) => {
                  const items = [...block.items];
                  items[itemIndex] = event.target.value;
                  onChange({ ...block, items });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...block, items: block.items.filter((_, current) => current !== itemIndex) })}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => onChange({ ...block, items: [...block.items, ""] })}>
            Add item
          </Button>
        </div>
      ) : null}
      {block.type === "steps" ? (
        <div className="space-y-4">
          {block.items.map((item, itemIndex) => (
            <div key={`${block.key}-step-${itemIndex}`} className="grid gap-2 rounded-control border border-line p-3">
              <Field
                label={`Step ${itemIndex + 1} title`}
                value={item.title}
                onChange={(title) => {
                  const items = [...block.items];
                  items[itemIndex] = { ...item, title };
                  onChange({ ...block, items });
                }}
              />
              <Field
                label="Step copy"
                value={item.text}
                multiline
                onChange={(text) => {
                  const items = [...block.items];
                  items[itemIndex] = { ...item, text };
                  onChange({ ...block, items });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...block, items: block.items.filter((_, current) => current !== itemIndex) })}
              >
                Remove step
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => onChange({ ...block, items: [...block.items, { title: "", text: "" }] })}>
            Add step
          </Button>
        </div>
      ) : null}
      {block.type === "faq" ? (
        <div className="space-y-4">
          {block.items.map((item, itemIndex) => (
            <div key={`${block.key}-faq-${itemIndex}`} className="grid gap-2 rounded-control border border-line p-3">
              <Field
                label="Question"
                value={item.question}
                onChange={(question) => {
                  const items = [...block.items];
                  items[itemIndex] = { ...item, question };
                  onChange({ ...block, items });
                }}
              />
              <Field
                label="Answer"
                value={item.answer}
                multiline
                onChange={(answer) => {
                  const items = [...block.items];
                  items[itemIndex] = { ...item, answer };
                  onChange({ ...block, items });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...block, items: block.items.filter((_, current) => current !== itemIndex) })}
              >
                Remove question
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => onChange({ ...block, items: [...block.items, { question: "", answer: "" }] })}>
            Add question
          </Button>
        </div>
      ) : null}
      {block.type === "cta" ? (
        <div className="grid gap-3">
          <Field label="Title" value={block.title} onChange={(title) => onChange({ ...block, title })} />
          <Field label="Copy" value={block.text} multiline onChange={(text) => onChange({ ...block, text })} />
          <Field label="Button label" value={block.label} onChange={(label) => onChange({ ...block, label })} />
          <Field label="Internal path" value={block.href} onChange={(href) => onChange({ ...block, href })} />
        </div>
      ) : null}
    </article>
  );
}

export function BlockEditor({ blocks, onChange }: { blocks: DraftBlock[]; onChange: (blocks: DraftBlock[]) => void }) {
  const [pendingType, setPendingType] = useState<DraftBlock["type"]>("paragraph");
  const counts = useMemo(() => blocks.length, [blocks.length]);

  function updateAt(index: number, next: DraftBlock) {
    onChange(blocks.map((block, current) => (current === index ? next : block)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <BlockCard
          key={block.key}
          block={block}
          index={index}
          total={counts}
          onChange={(next) => updateAt(index, next)}
          onMove={(direction) => move(index, direction)}
          onRemove={() => onChange(blocks.filter((_, current) => current !== index))}
        />
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-10 rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent"
          value={pendingType}
          onChange={(event) => setPendingType(event.target.value as DraftBlock["type"])}
        >
          {TYPES.map((item) => (
            <option key={item.type} value={item.type}>
              {item.label}
            </option>
          ))}
        </select>
        <Button type="button" variant="secondary" onClick={() => onChange([...blocks, emptyBlock(pendingType)])}>
          Add block
        </Button>
      </div>
    </div>
  );
}
