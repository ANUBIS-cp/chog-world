import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
  openGraph: {
    title: "Chog World",
    description: "Vote, tip, and comment on Chog memes. Built on Monad.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Chog World" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="bg-[#0B0B0F] text-[#F0F0F5] min-h-screen antialiased font-[family-name:var(--font-inter)]">
        <Providers>
          <Ticker />
          <Nav />
          <div className="flex max-w-[1400px] mx-auto">
            <Sidebar />
            <main className="flex-1 min-w-0 px-4 pb-20 pt-4 lg:ml-[240px]">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
