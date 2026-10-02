import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { ConvertSessionProvider } from "@/components/convert/ConvertSession";
import { brandMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = brandMetadata();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fbfaf9] font-sans text-ink antialiased">
        <div className="flex min-h-screen flex-col">
          <ConvertSessionProvider>
            <Header />
            <main className="flex-1">
              <Container className="pb-0 pt-10 sm:pt-12">{children}</Container>
            </main>
            <Footer />
          </ConvertSessionProvider>
        </div>
      </body>
    </html>
  );
}
