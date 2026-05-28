"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Flame, Clock, Trophy, TrendingUp, ExternalLink } from "lucide-react";

const items = [
  { icon: Flame, label: "Hot", href: "/?sort=hot", sort: "hot" },
  { icon: Clock, label: "New", href: "/?sort=new", sort: "new" },
  { icon: Trophy, label: "Top", href: "/?sort=top", sort: "top" },
];

export function Sidebar() {
  const params = useSearchParams();
  const current = params.get("sort") || "hot";

  return (
    <aside className="hidden lg:block fixed left-0 top-12 w-[200px] h-[calc(100vh-48px)] overflow-y-auto px-3 py-4">
      <nav className="space-y-0.5">
        {items.map(item => {
          const active = current === item.sort;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-accent/10 text-accent" : "text-text-tertiary hover:bg-bg-tertiary hover:text-text-secondary"
              }`}
            >
              <item.icon size={17} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 pt-4 border-t border-border">
        <h3 className="px-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Resources</h3>
        <a href="https://testnet.monadscan.com/address/0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3" target="_blank" rel="noopener" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-tertiary hover:bg-bg-tertiary hover:text-text-secondary transition-colors">
          <ExternalLink size={17} />
          Escrow
        </a>
      </div>
    </aside>
  );
}
