import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { Ticker } from "@/components/Ticker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chog World — Meme Feed & Tipping",
  description: "The Chog community feed. Vote, tip, and comment on the best Chog memes.",
  openGraph: {
    title: "Chog World",
    description: "Vote, tip, and comment on Chog memes.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0f] text-white min-h-screen`}>
        <Providers>
          <Ticker />
          <Nav />
          <main className="max-w-2xl mx-auto px-4 pb-20">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
