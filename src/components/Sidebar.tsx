"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Flame, Clock, Trophy, MessageSquare, Shield, Wallet, TrendingUp } from "lucide-react";

const navItems = [
  { icon: Flame, label: "Hot", href: "/?sort=hot", sort: "hot" },
  { icon: Clock, label: "New", href: "/?sort=new", sort: "new" },
  { icon: Trophy, label: "Top", href: "/?sort=top", sort: "top" },
];

export function Sidebar() {
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "hot";

  return (
    <aside className="hidden lg:block fixed left-0 top-[57px] w-[220px] h-[calc(100vh-57px)] overflow-y-auto px-3 py-4">
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const isActive = currentSort === item.sort;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#7C5CFF]/10 text-[#7C5CFF]"
                  : "text-[#6B7280] hover:bg-[#1A1A24] hover:text-[#9CA3AF]"
              }`}
            >
              <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 pt-4 border-t border-[#1E1E2E]">
        <h3 className="px-3 text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider mb-2">
          Communities
        </h3>
        <nav className="space-y-0.5">
          {[
            { icon: Shield, label: "$CHOG" },
            { icon: TrendingUp, label: "Alpha" },
            { icon: MessageSquare, label: "Memes" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#6B7280] cursor-not-allowed"
            >
              <item.icon size={17} />
              {item.label}
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-6 pt-4 border-t border-[#1E1E2E]">
        <a
          href="https://testnet.monadscan.com/address/0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#6B7280] hover:bg-[#1A1A24] hover:text-[#9CA3AF] transition-colors"
        >
          <Wallet size={17} />
          Escrow
        </a>
      </div>
    </aside>
  );
}
