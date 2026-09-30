import { Chip } from "@/components/ui/Chip";
import { tools } from "@/lib/tools";

const GROUPS = ["Gambar", "PDF", "Font", "Video", "Audio"] as const;

export function ToolGroups() {
  return (
    <section className="flex flex-col gap-8">
      {GROUPS.map((group) => {
        const list = tools.filter((tool) => tool.category === group);
        if (!list.length) return null;
        return (
          <div key={group} id={group.toLowerCase()} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">{group}</h2>
            <div className="flex flex-wrap gap-2">
              {list.map((tool) => (
                <Chip key={tool.slug} href={`/${tool.slug}`} soon={tool.need === "vps"}>
                  {tool.title}
                </Chip>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
