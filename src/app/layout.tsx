import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { Sidebar } from "@/components/Sidebar";
import { Ticker } from "@/components/Ticker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Chog World — CHOG Meme Feed & Tipping",
  description: "The Chog community feed. Vote, tip, and comment on the best Chog memes. Built on Monad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="bg-[#0B0B0F] text-[#F0F0F5] min-h-screen antialiased font-[family-name:var(--font-inter)]">
        <Providers>
          <Ticker />
          <Nav />
          <div className="flex max-w-[1400px] mx-auto">
            <Suspense fallback={<aside className="hidden lg:block w-[220px]" />}>
              <Sidebar />
            </Suspense>
            <main className="flex-1 min-w-0 px-3 sm:px-4 pb-20 pt-3 lg:ml-[220px]">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
