import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { Ticker } from "@/components/Ticker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chog World — CHOG Meme Feed",
  description: "Vote, tip, and comment on Chog memes from X. Built on Monad.",
  openGraph: {
    title: "Chog World",
    description: "Vote, tip, and comment on Chog memes. Built on Monad.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Chog World" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-[#0a0a0f] text-zinc-200 min-h-screen antialiased"}>
        <Providers>
          <Ticker />
          <Nav />
          <main className="max-w-2xl mx-auto px-4 pb-20 pt-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
