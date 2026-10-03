import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export function Article({ title, children }: Props) {
  return (
    <article className="grid gap-8 sm:gap-10 lg:grid-cols-[0.6fr_1.4fr] lg:gap-12">
      <header>
        <p className="flex items-center gap-3 text-eyebrow font-bold uppercase text-accent-ink">
          <span className="h-px w-8 bg-accent-ink" />
          Legal
        </p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] text-ink">{title}</h1>
        <p className="mt-4 text-xs leading-5 text-faint">Clear policies, written for people.</p>
      </header>
      <div className="flex flex-col gap-5 rounded-tile border border-[#e5dfdc] bg-white p-6 text-sm leading-7 text-mute shadow-tile sm:p-8">
        {children}
      </div>
    </article>
  );
}
