import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
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
      <body className="min-h-screen bg-[#fbfaf9] font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
