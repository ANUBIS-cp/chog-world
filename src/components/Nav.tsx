"use client";
import Link from "next/link";
import { useWallet } from "@/lib/wallet";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export function Nav() {
  const { address, hasWallet, connect, disconnect } = useWallet();
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [search, setSearch] = useState("");
  const authRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && setUser(data.session.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function click(e: MouseEvent) {
      if (authRef.current && !authRef.current.contains(e.target as Node)) setShowAuth(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
    }
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, []);

  async function signInGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    setShowAuth(false);
  }

  async function signInEmail() {
    const email = window.prompt("Enter email:");
    if (!email || !email.includes("@")) return;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) window.alert(error.message);
    else window.alert("Check your email!");
    setShowAuth(false);
  }

  function doSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) window.location.href = `/?q=${encodeURIComponent(search.trim())}`;
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#0B0B0F]/95 backdrop-blur border-b border-[#1E1E2E]">
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-[#7C5CFF] rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <span className="font-bold text-sm">Chog World</span>
        </Link>

        <form onSubmit={doSearch} className="flex-1 max-w-sm mx-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/></svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search CHOG..."
              className="w-full bg-[#1A1A24] border border-[#252534] rounded-lg pl-9 pr-4 py-1.5 text-sm text-[#F0F0F5] placeholder-[#4B5563] focus:outline-none focus:border-[#7C5CFF]/50 transition-colors"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          {address ? (
            <button onClick={disconnect} className="text-xs bg-[#1A1A24] border border-[#252534] px-3 py-1.5 rounded-lg hover:border-[#3A3A50] transition">
              {address.slice(0, 5)}...{address.slice(-3)}
            </button>
          ) : (
            <button onClick={connect} className={`text-xs px-3 py-1.5 rounded-lg transition ${hasWallet ? "bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20" : "bg-[#3A3A50] text-[#9CA3AF] cursor-help"}`} title={hasWallet ? "Connect your wallet" : "No wallet extension detected"}>
              {hasWallet ? "Connect" : "No Wallet"}
            </button>
          )}

          {user ? (
            <div className="relative" ref={userRef}>
              <button onClick={() => setShowUser(!showUser)} className="text-xs bg-[#1A1A24] border border-[#252534] px-3 py-1.5 rounded-lg hover:border-[#3A3A50] transition">
                {user.email?.slice(0, 10)}...
              </button>
              {showUser && (
                <div className="absolute right-0 mt-2 bg-[#13131A] border border-[#252534] rounded-xl p-1 min-w-[140px] shadow-xl z-50">
                  <button onClick={() => { supabase.auth.signOut(); setShowUser(false); }} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-[#1A1A24] rounded-lg transition">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={authRef}>
              <button onClick={() => setShowAuth(!showAuth)} className="text-xs bg-[#7C5CFF] text-white px-3 py-1.5 rounded-lg hover:bg-[#8B6DFF] transition">
                Sign In
              </button>
              {showAuth && (
                <div className="absolute right-0 mt-2 bg-[#13131A] border border-[#252534] rounded-xl p-1 min-w-[160px] shadow-xl z-50">
                  <button onClick={signInGoogle} className="w-full text-left px-3 py-2 text-xs text-[#F0F0F5] hover:bg-[#1A1A24] rounded-lg transition">
                    Google
                  </button>
                  <button onClick={signInEmail} className="w-full text-left px-3 py-2 text-xs text-[#F0F0F5] hover:bg-[#1A1A24] rounded-lg transition">
                    Email
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
