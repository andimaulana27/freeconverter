import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Header } from "@/components/layout/Header";
import { AdSlot } from "@/components/layout/AdSlot";
import { Footer } from "@/components/layout/Footer";
import { StickyAdRails } from "@/components/layout/StickyAdRails";
import { Container } from "@/components/ui/Container";
import { ConvertSessionProvider } from "@/components/convert/ConvertSession";
import { brandMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = brandMetadata();

export const viewport: Viewport = {
  themeColor: "#d92d28",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fbfaf9] font-sans text-ink antialiased">
        <div className="flex min-h-screen flex-col">
          <ConvertSessionProvider>
            <Header />
            <main className="relative flex-1">
              <StickyAdRails />
              <Container className="pb-0 pt-10 sm:pt-12">{children}</Container>
              <Container className="py-10 sm:py-12">
                <AdSlot />
              </Container>
            </main>
            <Footer />
          </ConvertSessionProvider>
        </div>
        {process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT ? (
          <Script
            id="google-adsense"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT}`}
          />
        ) : null}
      </body>
    </html>
  );
}
