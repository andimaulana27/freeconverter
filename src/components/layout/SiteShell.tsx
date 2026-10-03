import type { ReactNode } from "react";
import Script from "next/script";
import { AdConfigProvider } from "@/components/layout/AdConfigProvider";
import { AdSlot } from "@/components/layout/AdSlot";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StickyAdRails } from "@/components/layout/StickyAdRails";
import { Container } from "@/components/ui/Container";
import { ConvertSessionProvider } from "@/components/convert/ConvertSession";
import { disabledAdConfig, getPublicAdConfig } from "@/lib/ads/queries";

export async function SiteShell({ children, ads = true }: { children: ReactNode; ads?: boolean }) {
  const config = ads ? await getPublicAdConfig() : disabledAdConfig();

  return (
    <AdConfigProvider value={config}>
      <div className="flex min-h-screen flex-col">
        <ConvertSessionProvider>
          <Header />
          <main className="relative flex-1">
            {ads ? <StickyAdRails /> : null}
            <Container className="pb-0 pt-10 sm:pt-12">{children}</Container>
            {ads ? (
              <Container className="py-10 sm:py-12">
                <AdSlot placement="global_pre_footer" />
              </Container>
            ) : null}
          </main>
          <Footer />
        </ConvertSessionProvider>
      </div>
      {ads && config.needsAdSenseScript && config.adsenseClientId ? (
        <Script
          id="google-adsense"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsenseClientId}`}
        />
      ) : null}
    </AdConfigProvider>
  );
}
