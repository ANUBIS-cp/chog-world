import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { WalletProvider } from "@/lib/wallet";
import { Nav } from "@/components/Nav";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Chog World",
  description: "CHOG meme feed and tipping on Monad",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-[#0B0B0F] text-[#F0F0F5] min-h-screen font-sans antialiased">
        <WalletProvider>
          <Nav />
          <div className="flex max-w-[1200px] mx-auto">
            <Suspense fallback={<aside className="hidden lg:block w-[200px]" />}>
              <Sidebar />
            </Suspense>
            <main className="flex-1 min-w-0 px-4 pb-20 pt-4">
              {children}
            </main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
