"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Clock, Trophy, MessageSquare, Shield, Wallet, TrendingUp } from "lucide-react";

const navItems = [
  { icon: Flame, label: "Hot", href: "/?sort=hot", sort: "hot" },
  { icon: Clock, label: "New", href: "/?sort=new", sort: "new" },
  { icon: Trophy, label: "Top", href: "/?sort=top", sort: "top" },
];

const communities = [
  { icon: Shield, label: "$CHOG", href: "/community/chog" },
  { icon: TrendingUp, label: "Alpha", href: "/community/alpha" },
  { icon: MessageSquare, label: "Memes", href: "/community/memes" },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const currentSort = searchParams.get("sort") || "hot";

  return (
    <aside className="hidden lg:block fixed left-0 top-[104px] w-[240px] h-[calc(100vh-104px)] overflow-y-auto px-4 py-2">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === "/" && currentSort === item.sort;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#1A1A24] text-[#7C5CFF] border-l-[3px] border-[#7C5CFF]"
                  : "text-[#9CA3AF] hover:bg-[#1A1A24] hover:text-[#F0F0F5]"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 pt-6 border-t border-[#252534]">
        <h3 className="px-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
          Communities
        </h3>
        <nav className="space-y-1">
          {communities.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#9CA3AF] hover:bg-[#1A1A24] hover:text-[#F0F0F5] transition-all duration-200"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 pt-6 border-t border-[#252534]">
        <h3 className="px-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
          Resources
        </h3>
        <nav className="space-y-1">
          <a href="https://testnet.monadscan.com/address/0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3" target="_blank" rel="noopener"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#9CA3AF] hover:bg-[#1A1A24] hover:text-[#F0F0F5] transition-all duration-200">
            <Wallet size={18} />
            Escrow Contract
          </a>
        </nav>
      </div>
    </aside>
  );
}
