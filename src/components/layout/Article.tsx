import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";

export type ArticleNavItem = {
  id: string;
  label: string;
};

type DocumentLink = {
  href: string;
  label: string;
  active?: boolean;
};

type Props = {
  title: string;
  description?: string;
  updated?: string;
  sections: readonly ArticleNavItem[];
  documents?: readonly DocumentLink[];
  children: ReactNode;
};

type SectionProps = {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
};

type SummaryProps = {
  eyebrow: string;
  title: string;
  signals: readonly string[];
  children: ReactNode;
};

function SectionNav({ sections }: { sections: readonly ArticleNavItem[] }) {
  return (
    <ol className="mt-3 space-y-1">
      {sections.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="group flex items-center gap-3 rounded-control px-3 py-2 text-xs text-mute outline-none transition duration-180 hover:translate-x-1 hover:bg-white hover:text-ink focus-visible:ring-2 focus-visible:ring-ink"
          >
            <span className="font-mono text-micro text-faint transition group-hover:text-ink">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex-1">{section.label}</span>
            <svg
              viewBox="0 0 16 16"
              className="h-3 w-3 -translate-x-1 opacity-0 transition duration-180 group-hover:translate-x-0 group-hover:opacity-100"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <path d="M3 8h9m-3-3 3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </li>
      ))}
    </ol>
  );
}

export function ArticleSummary({ eyebrow, title, signals, children }: SummaryProps) {
  return (
    <section className="group relative isolate overflow-hidden rounded-tile border border-white/10 bg-[#171311] p-6 text-white shadow-panel-dark sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:36px_36px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 -top-20 -z-10 h-52 w-52 rounded-full border-[42px] border-white/[0.035] transition duration-700 group-hover:scale-110"
        aria-hidden
      />
      <p className="flex items-center gap-3 font-mono text-micro uppercase text-accent-light">
        <span className="h-px w-6 bg-accent-light" />
        {eyebrow}
      </p>
      <h2 className="mt-4 max-w-xl text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{title}</h2>
      <div className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{children}</div>
      <ul className="mt-6 grid gap-2 sm:grid-cols-3">
        {signals.map((signal, index) => (
          <li
            key={signal}
            className="flex items-center gap-2 rounded-control border border-white/10 bg-white/[0.045] px-3 py-2.5 font-mono text-micro uppercase text-white/65 transition duration-280 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            <span className="text-accent-light">0{index + 1}</span>
            {signal}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ArticleSection({ id, index, title, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="group relative scroll-mt-28 overflow-hidden rounded-card border border-[#e5dfdc] bg-white p-5 shadow-drop outline-none transition duration-280 hover:-translate-y-0.5 hover:border-[#cec5c0] hover:shadow-tile focus-within:border-ink sm:p-7"
    >
      <span
        className="absolute inset-y-0 left-0 w-1 origin-bottom scale-y-0 bg-ink transition-transform duration-280 group-hover:scale-y-100 group-focus-within:scale-y-100"
        aria-hidden
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-micro uppercase text-faint">Section {index}</p>
          <h2 id={`${id}-title`} className="mt-1 text-lg font-semibold tracking-[-0.025em] text-ink sm:text-xl">
            {title}
          </h2>
        </div>
        <a
          href="#legal-top"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line text-faint opacity-70 outline-none transition duration-180 hover:-translate-y-0.5 hover:border-ink hover:text-ink group-hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ink"
          aria-label="Back to top"
          title="Back to top"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <path d="m4 7 4-4 4 4M8 3v10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function Article({
  title,
  description = "Clear policies, written for people.",
  updated,
  sections,
  documents = [],
  children,
}: Props) {
  return (
    <article id="legal-top" className="grid scroll-mt-28 gap-8 sm:gap-10 lg:grid-cols-[0.52fr_1.48fr] lg:gap-14">
      <header className="min-w-0 lg:sticky lg:top-28 lg:self-start">
        <p className="flex items-center gap-3 text-eyebrow font-bold uppercase text-accent-ink">
          <span className="h-px w-8 bg-accent-ink" />
          Legal document
        </p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] text-ink sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-sm text-sm leading-6 text-mute">{description}</p>
        {updated ? (
          <div className="mt-6 inline-flex items-center gap-3 rounded-control border border-[#e5dfdc] bg-white px-4 py-3 shadow-drop">
            <span className="h-2 w-2 rounded-full bg-ink" aria-hidden />
            <p className="font-mono text-micro uppercase text-faint">Effective {updated}</p>
          </div>
        ) : null}

        {documents.length ? (
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Legal documents">
            {documents.map((document) => (
              <ButtonLink
                key={document.href}
                href={document.href}
                variant={document.active ? "ink" : "secondary"}
                size="sm"
                aria-current={document.active ? "page" : undefined}
              >
                {document.label}
              </ButtonLink>
            ))}
          </nav>
        ) : null}

        <nav className="mt-8 hidden border-t border-[#ded8d4] pt-5 lg:block" aria-label="On this page">
          <p className="font-mono text-micro uppercase text-faint">On this page</p>
          <SectionNav sections={sections} />
        </nav>

        <details className="group/nav mt-6 rounded-card border border-[#ded8d4] bg-white p-2 shadow-drop open:shadow-tile lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-control px-3 py-2 font-mono text-micro uppercase text-faint outline-none transition hover:bg-bone focus-visible:ring-2 focus-visible:ring-ink">
            On this page
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 transition duration-180 group-open/nav:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden
            >
              <path d="m3.5 6 4.5 4 4.5-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <SectionNav sections={sections} />
        </details>
      </header>
      <div className="flex min-w-0 flex-col gap-4 text-sm leading-7 text-mute">{children}</div>
    </article>
  );
}
