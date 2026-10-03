import Image from "next/image";
import Link from "next/link";
import { GuideBody, splitGuideBlocks } from "@/components/blog/GuideBody";
import { GuideCard } from "@/components/blog/GuideCard";
import { AdSlot } from "@/components/layout/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { tableOfContents } from "@/lib/blog/content";
import { blogArticleJsonLd, blogBreadcrumbJsonLd, blogFaqJsonLd, guideDateLabel } from "@/lib/blog/metadata";
import type { BlogPost, BlogPostSummary } from "@/lib/blog/queries";
import { toolHeadline } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { getTool, toolBlurb } from "@/lib/tools";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 10h13m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GuideArticle({
  post,
  related,
  ads = true,
  preview = false,
}: {
  post: BlogPost;
  related: BlogPostSummary[];
  ads?: boolean;
  preview?: boolean;
}) {
  const toc = tableOfContents(post.body);
  const { before, after } = splitGuideBlocks(post.body.blocks);
  const tools = post.toolSlugs.flatMap((toolSlug) => {
    const tool = getTool(toolSlug);
    return tool ? [tool] : [];
  });
  const primaryTool = tools[0];
  const faq = blogFaqJsonLd(post.body);
  const jsonLd = preview
    ? []
    : [
        blogArticleJsonLd(post),
        blogBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/blog" },
          { name: post.title, path: post.canonicalPath },
        ]),
        ...(faq ? [faq] : []),
      ];

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      {jsonLd.length ? <JsonLd data={jsonLd} /> : null}

      {preview ? (
        <p className="rounded-control border border-accent/20 bg-accent-soft px-3 py-2 text-sm text-accent-ink">
          Preview · not indexed · production ads are off
        </p>
      ) : null}

      <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-12">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-faint">
              <li><Link href="/" className="transition hover:text-ink">Home</Link></li>
              <li aria-hidden>/</li>
              <li><Link href="/blog" className="transition hover:text-ink">Guides</Link></li>
              <li aria-hidden>/</li>
              <li className="text-ink" aria-current="page">{post.title}</li>
            </ol>
          </nav>

          <header className="mt-6 max-w-3xl">
            <p className="text-eyebrow font-bold uppercase text-accent-ink">{post.topic?.name ?? "Guide"}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-ink sm:text-5xl">{post.title}</h1>
            {post.excerpt ? <p className="mt-4 text-base leading-7 text-mute">{post.excerpt}</p> : null}
            <p className="mt-5 font-mono text-micro uppercase text-faint">
              {SITE_NAME} · Updated {guideDateLabel(post.updatedAt)} · {post.readingMinutes} min read
            </p>
          </header>

          {post.cover ? (
            post.cover.url.includes(".svg") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.cover.url}
                alt={post.cover.alt}
                width={1200}
                height={630}
                className="mt-8 aspect-[1.91/1] w-full rounded-tile border border-[#e5dfdc] object-cover"
              />
            ) : (
              <Image
                src={post.cover.url}
                alt={post.cover.alt}
                width={1200}
                height={630}
                className="mt-8 aspect-[1.91/1] w-full rounded-tile border border-[#e5dfdc] object-cover"
              />
            )
          ) : null}

          {toc.length ? (
            <details className="mt-8 rounded-card border border-[#e5dfdc] bg-white p-4 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold text-ink">On this page</summary>
              <ol className="mt-3 space-y-2">
                {toc.map((item) => (
                  <li key={item.id} className={item.level === 3 ? "pl-3" : undefined}>
                    <a href={`#${item.id}`} className="text-sm text-mute hover:text-accent">{item.text}</a>
                  </li>
                ))}
              </ol>
            </details>
          ) : null}

          <div className="mt-8 max-w-3xl">
            <GuideBody blocks={before} />
            {after.length ? (
              <>
                {ads ? <div className="my-8"><AdSlot /></div> : null}
                <GuideBody blocks={after} />
              </>
            ) : ads ? (
              <div className="mt-8"><AdSlot /></div>
            ) : null}
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block lg:space-y-4">
          {toc.length ? (
            <nav aria-label="On this page" className="rounded-card border border-[#e5dfdc] bg-white p-4 shadow-drop">
              <p className="text-micro font-bold uppercase text-faint">On this page</p>
              <ol className="mt-3 space-y-2">
                {toc.map((item) => (
                  <li key={item.id} className={item.level === 3 ? "pl-3" : undefined}>
                    <a href={`#${item.id}`} className="text-sm leading-5 text-mute transition hover:text-accent">{item.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          {ads ? <AdSlot format="rectangle" className="hidden lg:flex" /> : null}
        </aside>
      </article>

      {tools.length ? (
        <section aria-labelledby="related-tools-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow font-bold uppercase text-accent-ink">Use the tool</p>
              <h2 id="related-tools-heading" className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">Related tools</h2>
            </div>
            <Link href="/tools" className="inline-flex items-center gap-2 text-xs font-semibold text-mute transition hover:text-accent">
              All tools <ArrowIcon />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, index) => (
              <Link
                key={tool.slug}
                href={`/${tool.slug}`}
                className="group rounded-card border border-[#e5dfdc] bg-white p-5 shadow-tile transition duration-280 hover:-translate-y-1 hover:border-[#d3cac6]"
              >
                <ToolIcon tool={tool} index={index + 1} />
                <h3 className="mt-4 text-sm font-semibold text-ink">{toolHeadline(tool)}</h3>
                <p className="mt-1 text-[11px] leading-5 text-mute">{toolBlurb(tool)}</p>
                {tool.need === "vps" ? <p className="mt-2 font-mono text-micro uppercase text-warn">Waiting for the dedicated worker</p> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section aria-labelledby="related-guides-heading">
          <h2 id="related-guides-heading" className="text-3xl font-semibold tracking-[-0.04em] text-ink">Related guides</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {related.map((item, index) => <GuideCard key={item.id} post={item} index={index} />)}
          </div>
        </section>
      ) : null}

      <section className="rounded-panel border border-white/10 bg-[#181412] p-6 text-white shadow-panel-dark sm:p-8">
        <p className="text-eyebrow font-bold uppercase text-accent-light">Next step</p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em]">
          {primaryTool ? `Open ${toolHeadline(primaryTool)}.` : "Bring the file to the workbench."}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
          {primaryTool?.need === "browser"
            ? "This matching tool runs in the browser. There is no account step."
            : "Pick the route that matches the file, then follow the processing note on that page."}
        </p>
        <Link
          href={primaryTool ? `/${primaryTool.slug}` : "/#converter"}
          className="mt-6 inline-flex items-center gap-3 rounded-control bg-accent px-5 py-3.5 text-sm font-semibold text-white shadow-action transition duration-180 hover:-translate-y-0.5 hover:bg-accent-ink"
        >
          {primaryTool ? "Open the tool" : "Open the workbench"}
          <ArrowIcon />
        </Link>
      </section>
    </div>
  );
}
