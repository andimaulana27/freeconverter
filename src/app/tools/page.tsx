import { categories, toolsByCategory } from "@/lib/tools";
import { ToolCard } from "@/components/tools/ToolCard";

export const metadata = { title: "All tools" };

export default function ToolsIndex() {
  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-semibold tracking-tight">All tools</h1>
      {categories.map((category) => (
        <section key={category} className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">{category}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {toolsByCategory(category).map((tool) => (
              <li key={tool.slug}>
                <ToolCard tool={tool} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
