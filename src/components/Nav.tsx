"use client";
import { useWallet } from "@/lib/wallet";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Wallet as WalletIcon, LogOut, ChevronDown, Mail, Globe } from "lucide-react";
import { toast } from "sonner";

export function Nav() {
  const { address, connect, disconnect, isConnecting } = useWallet();
  const [user, setUser] = useState<any>(null);
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const authRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUser(data.session.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (authRef.current && !authRef.current.contains(e.target as Node)) setShowAuthMenu(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signInGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    if (error) toast.error(error.message);
    setShowAuthMenu(false);
  }

  async function signInEmail() {
    const email = prompt("Enter your email:");
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email format"); return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    if (error) toast.error(error.message);
    else toast.success("Check your email for magic link!");
    setShowAuthMenu(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-[#252534]">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🐸</span>
          <span className="font-bold text-lg hidden sm:block">Chog World</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Chog memes..."
              className="w-full bg-[#1A1A24] border border-[#252534] rounded-full pl-10 pr-4 py-2 text-sm text-[#F0F0F5] placeholder-[#6B7280] focus:outline-none focus:border-[#7C5CFF] transition-colors"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          {address ? (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1A24] border border-[#252534] text-sm font-mono text-[#9CA3AF] hover:border-[#3A3A50] transition-colors"
            >
              <WalletIcon size={14} />
              <span className="hidden sm:inline">{address.slice(0, 6)}...{address.slice(-4)}</span>
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-sm text-[#22C55E] hover:bg-[#22C55E]/20 transition-colors disabled:opacity-50"
            >
              <WalletIcon size={14} />
              <span className="hidden sm:inline">{isConnecting ? "..." : "Connect"}</span>
            </button>
          )}

          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1A24] border border-[#252534] text-sm text-[#9CA3AF] hover:border-[#3A3A50] transition-colors"
              >
                <span className="max-w-[120px] truncate">{user.email}</span>
                <ChevronDown size={14} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 bg-[#13131A] border border-[#252534] rounded-xl p-1 min-w-[180px] shadow-2xl z-50">
                  <button
                    onClick={() => { supabase.auth.signOut(); setShowUserMenu(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-[#EF4444] hover:bg-[#1A1A24] rounded-lg transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={authRef}>
              <button
                onClick={() => setShowAuthMenu(!showAuthMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#7C5CFF] text-white text-sm font-medium hover:bg-[#9A7FFF] transition-colors"
              >
                Sign In
                <ChevronDown size={14} />
              </button>
              {showAuthMenu && (
                <div className="absolute right-0 mt-2 bg-[#13131A] border border-[#252534] rounded-xl p-1 min-w-[200px] shadow-2xl z-50">
                  <button
                    onClick={signInGoogle}
                    className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-[#F0F0F5] hover:bg-[#1A1A24] rounded-lg transition-colors"
                  >
                    <Globe size={16} /> Sign in with Google
                  </button>
                  <button
                    onClick={signInEmail}
                    className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-[#F0F0F5] hover:bg-[#1A1A24] rounded-lg transition-colors"
                  >
                    <Mail size={16} /> Sign in with Email
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
