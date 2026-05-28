"use client";
import Link from "next/link";
import { useWallet } from "@/lib/wallet";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Wallet, LogOut, ChevronDown, Mail, Globe, Zap } from "lucide-react";

export function Nav() {
  const { address, connect, disconnect } = useWallet();
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
    <nav className="sticky top-0 z-50 bg-bg-primary/95 backdrop-blur border-b border-border">
      <div className="max-w-[1200px] mx-auto px-4 h-12 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm hidden sm:block">Chog World</span>
        </Link>

        <form onSubmit={doSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search CHOG..."
              className="w-full bg-bg-tertiary border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          {address ? (
            <button onClick={disconnect} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-xs font-mono text-text-secondary hover:border-border-hover transition">
              <Wallet size={13} />
              <span className="hidden sm:inline">{address.slice(0, 5)}...{address.slice(-3)}</span>
            </button>
          ) : (
            <button onClick={connect} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400 hover:bg-green-500/20 transition">
              <Wallet size={13} />
              <span className="hidden sm:inline">Connect</span>
            </button>
          )}

          {user ? (
            <div className="relative" ref={userRef}>
              <button onClick={() => setShowUser(!showUser)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-xs text-text-secondary hover:border-border-hover transition">
                <span className="max-w-[100px] truncate">{user.email}</span>
                <ChevronDown size={12} />
              </button>
              {showUser && (
                <div className="absolute right-0 mt-2 bg-bg-secondary border border-border rounded-xl p-1 min-w-[160px] shadow-xl z-50">
                  <button onClick={() => { supabase.auth.signOut(); setShowUser(false); }} className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-bg-tertiary rounded-lg transition">
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={authRef}>
              <button onClick={() => setShowAuth(!showAuth)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition">
                Sign In
                <ChevronDown size={12} />
              </button>
              {showAuth && (
                <div className="absolute right-0 mt-2 bg-bg-secondary border border-border rounded-xl p-1 min-w-[180px] shadow-xl z-50">
                  <button onClick={signInGoogle} className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary rounded-lg transition">
                    <Globe size={14} /> Google
                  </button>
                  <button onClick={signInEmail} className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary rounded-lg transition">
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
