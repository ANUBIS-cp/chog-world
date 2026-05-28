import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Chog World",
  description: "CHOG meme feed and tipping",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0B0B0F] text-[#F0F0F5] min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
