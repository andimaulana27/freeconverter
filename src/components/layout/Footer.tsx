import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SITE_NAME } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[#eae5e2] bg-white">
      <Container className="flex flex-col justify-between gap-5 py-8 text-xs text-faint sm:flex-row sm:items-center">
        <div>
          <Link href="/" className="font-bold tracking-tight text-ink transition duration-180 hover:text-accent">
            {SITE_NAME.slice(0, 6)}<span className="text-accent">{SITE_NAME.slice(6)}</span>
          </Link>
          <p className="mt-1">Simple, private, and free file tools.</p>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/tools" className="transition duration-180 hover:text-ink">All tools</Link>
          <Link href="/privacy" className="transition duration-180 hover:text-ink">Privacy</Link>
          <Link href="/terms" className="transition duration-180 hover:text-ink">Terms</Link>
        </nav>
      </Container>
    </footer>
  );
}
