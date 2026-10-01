import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export function Article({ title, children }: Props) {
  return (
    <article className="grid gap-10 pb-12 lg:grid-cols-[0.6fr_1.4fr] lg:gap-20">
      <header>
        <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          <span className="h-px w-8 bg-accent" />
          Legal
        </p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] text-ink">{title}</h1>
        <p className="mt-4 text-xs leading-5 text-faint">Clear policies, written for people.</p>
      </header>
      <div className="flex flex-col gap-5 rounded-[24px] border border-[#e5dfdc] bg-white p-6 text-sm leading-7 text-mute sm:p-9">
        {children}
      </div>
    </article>
  );
}
