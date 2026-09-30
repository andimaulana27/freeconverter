import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer>
      <Container className="flex items-center gap-3 pb-10 pt-2 text-xs text-faint">
        <Link href="/privacy" className="transition duration-180 hover:text-ink">
          Privacy
        </Link>
        <span aria-hidden>·</span>
        <Link href="/terms" className="transition duration-180 hover:text-ink">
          Terms
        </Link>
      </Container>
    </footer>
  );
}
