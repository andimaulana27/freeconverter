import { ButtonLink } from "@/components/ui/Button";
import { SiteShell } from "@/components/layout/SiteShell";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="flex max-w-lg flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-sm text-mute">That tool does not exist yet. Pick one from the list.</p>
        <ButtonLink href="/tools" variant="primary" size="md" className="self-start">
          Browse tools
        </ButtonLink>
      </div>
    </SiteShell>
  );
}
