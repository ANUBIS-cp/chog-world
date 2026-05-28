"use client";
import { useEffect, useState, useRef } from "react";
import { useWallet } from "@/lib/wallet";
import Link from "next/link";
import { supabase } from "@/lib/api";
import { toast } from "sonner";
import { Search, Wallet, LogOut, ChevronDown, Mail, Globe } from "lucide-react";

export function Nav() {
  const { address, connect, disconnect, isConnecting } = useWallet();
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showUser, setShowUser] = useState(false);
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
      if (authRef.current && !authRef.current.contains(e.target as Node)) setShowAuth(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
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
    setShowAuth(false);
  }

  async function signInEmail() {
    const email = prompt("Enter your email:");
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email"); return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    if (error) toast.error(error.message);
    else toast.success("Check your email!");
    setShowAuth(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#0B0B0F]/90 backdrop-blur-xl border-b border-[#1E1E2E]">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🐸</span>
          <span className="font-bold text-base hidden sm:block">Chog World</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#1A1A24] border border-[#252534] rounded-xl pl-9 pr-4 py-2 text-sm text-[#F0F0F5] placeholder-[#4B5563] focus:outline-none focus:border-[#7C5CFF]/50 transition-colors"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          {address ? (
            <button
              onClick={disconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1A24] border border-[#252534] text-xs font-mono text-[#9CA3AF] hover:border-[#3A3A50] transition-colors"
            >
              <Wallet size={13} />
              <span className="hidden sm:inline">{address.slice(0, 5)}...{address.slice(-3)}</span>
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-xs text-[#22C55E] hover:bg-[#22C55E]/20 transition-colors disabled:opacity-50"
            >
              <Wallet size={13} />
              <span className="hidden sm:inline">{isConnecting ? "..." : "Connect"}</span>
            </button>
          )}

          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUser(!showUser)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1A24] border border-[#252534] text-xs text-[#9CA3AF] hover:border-[#3A3A50] transition-colors"
              >
                <span className="max-w-[100px] truncate">{user.email}</span>
                <ChevronDown size={12} />
              </button>
              {showUser && (
                <div className="absolute right-0 mt-2 bg-[#13131A] border border-[#252534] rounded-xl p-1 min-w-[160px] shadow-2xl z-50">
                  <button
                    onClick={() => { supabase.auth.signOut(); setShowUser(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-[#EF4444] hover:bg-[#1A1A24] rounded-lg transition-colors"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={authRef}>
              <button
                onClick={() => setShowAuth(!showAuth)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7C5CFF] text-white text-xs font-medium hover:bg-[#8B6DFF] transition-colors"
              >
                Sign In
                <ChevronDown size={12} />
              </button>
              {showAuth && (
                <div className="absolute right-0 mt-2 bg-[#13131A] border border-[#252534] rounded-xl p-1 min-w-[180px] shadow-2xl z-50">
                  <button onClick={signInGoogle} className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-[#F0F0F5] hover:bg-[#1A1A24] rounded-lg transition-colors">
                    <Globe size={14} /> Google
                  </button>
                  <button onClick={signInEmail} className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-[#F0F0F5] hover:bg-[#1A1A24] rounded-lg transition-colors">
                    <Mail size={14} /> Email
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
