import type { Metadata } from "next";
import { faqEntries, type BlogBody } from "@/lib/blog/content";
import type { BlogPost, BlogPostSummary } from "@/lib/blog/queries";
import { absUrl, SITE_NAME } from "@/lib/site";

export function guideDateLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function blogIndexMetadata(topic: string | null): Metadata {
  const title = "Guides";
  const description = "Short file guides for choosing a format, converting in the browser, and fixing files that will not open.";
  return {
    title,
    description,
    alternates: {
      canonical: "/blog",
      types: { "application/rss+xml": "/rss.xml" },
    },
    robots: topic ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url: "/blog",
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

export function blogTopicMetadata(input: {
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}): Metadata {
  const title = input.seoTitle || `${input.name} guides`;
  const description = input.seoDescription || input.description || `Reviewed ${input.name.toLowerCase()} guides from ${SITE_NAME}.`;
  const path = `/blog/topic/${input.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

export function blogPostMetadata(post: BlogPost): Metadata {
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  return {
    title,
    description,
    alternates: { canonical: post.canonicalPath },
    robots: post.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "article",
      title,
      description,
      url: post.canonicalPath,
      siteName: SITE_NAME,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      images: post.cover ? [{ url: post.cover.url, alt: post.cover.alt }] : undefined,
    },
  };
}

export function blogIndexJsonLd(posts: BlogPostSummary[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} guides`,
    url: absUrl("/blog"),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absUrl("/"),
      logo: absUrl("/icon-512.png"),
    },
    blogPost: posts.filter((post) => !post.noindex).slice(0, 12).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: absUrl(post.canonicalPath),
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
    })),
  };
}

export function blogBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  };
}

export function blogArticleJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: absUrl(post.canonicalPath),
    url: absUrl(post.canonicalPath),
    image: post.cover ? [post.cover.url] : [absUrl("/opengraph-image")],
    author: { "@type": "Organization", name: SITE_NAME, url: absUrl("/") },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absUrl("/"),
      logo: { "@type": "ImageObject", url: absUrl("/icon-512.png") },
    },
  };
}

export function blogFaqJsonLd(body: BlogBody) {
  const faqs = faqEntries(body);
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
