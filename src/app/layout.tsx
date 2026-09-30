import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "FreeConverter — Convert files in the browser",
    template: "%s · FreeConverter",
  },
  description:
    "Drop a file and convert it. Images, PDF, and fonts run on your device. Video follows when the worker is ready.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} font-sans min-h-screen bg-bone text-ink antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 animate-enter">
            <Container className="py-10 sm:py-12">{children}</Container>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
