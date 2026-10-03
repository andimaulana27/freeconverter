import type { ReactNode } from "react";
import Script from "next/script";
import { Header } from "@/components/layout/Header";
import { AdSlot } from "@/components/layout/AdSlot";
import { Footer } from "@/components/layout/Footer";
import { StickyAdRails } from "@/components/layout/StickyAdRails";
import { Container } from "@/components/ui/Container";
import { ConvertSessionProvider } from "@/components/convert/ConvertSession";

export function SiteShell({ children, ads = true }: { children: ReactNode; ads?: boolean }) {
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <ConvertSessionProvider>
          <Header />
          <main className="relative flex-1">
            {ads ? <StickyAdRails /> : null}
            <Container className="pb-0 pt-10 sm:pt-12">{children}</Container>
            {ads ? (
              <Container className="py-10 sm:py-12">
                <AdSlot />
              </Container>
            ) : null}
          </main>
          <Footer />
        </ConvertSessionProvider>
      </div>
      {ads && process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT ? (
        <Script
          id="google-adsense"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT}`}
        />
      ) : null}
    </>
  );
}
