import { DropEngine } from "@/components/convert/DropEngine";
import { ToolGroups } from "@/components/tools/ToolGroups";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-5">
        <div className="flex max-w-xl flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-[2.15rem] sm:leading-tight">
            Drop a file. Get the format you need.
          </h1>
          <p className="text-sm leading-6 text-mute">
            No account. Images, PDF, and fonts convert on this device. Video waits for the dedicated worker.
          </p>
        </div>
        <DropEngine />
        <ol className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-faint">
          <li>1 · Drop</li>
          <li>2 · Convert</li>
          <li>3 · Download</li>
        </ol>
      </section>
      <ToolGroups />
    </div>
  );
}
