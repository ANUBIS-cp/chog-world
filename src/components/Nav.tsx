"use client";
import { useWallet } from "@/lib/wallet";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function Nav() {
  const { address, connect, disconnect } = useWallet();
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) setUser(data.session.user); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub?.subscription.unsubscribe();
  }, []);

  async function signInGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  }
  async function signInEmail() {
    const email = prompt("Enter your email:");
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) alert(error.message);
    else alert("Check your email for magic link!");
  }

  return (
    <nav className="sticky top-7 z-50 bg-[#0a0a0f]/80 backdrop-blur border-b border-[#1a1a2e]">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-purple-400 hover:text-purple-300">🐸 Chog World</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-zinc-400 max-w-[120px] truncate">{user.email}</span>
              <button onClick={() => supabase.auth.signOut()} className="text-sm text-zinc-500 hover:text-red-400">Sign Out</button>
            </>
          ) : (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="text-sm bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-md transition">Sign In</button>
              {showMenu && (
                <div className="absolute right-0 mt-2 bg-[#1a1a2e] border border-[#27274a] rounded-lg p-1 min-w-[180px] shadow-xl z-50">
                  <button onClick={() => { signInGoogle(); setShowMenu(false); }} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-[#27274a] rounded-md">G Sign in with Google</button>
                  <button onClick={() => { signInEmail(); setShowMenu(false); }} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-[#27274a] rounded-md">✉ Sign in with Email</button>
                </div>
              )}
            </div>
          )}
          {address ? (
            <button onClick={disconnect} className="text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition">
              {address.slice(0,6)}...{address.slice(-4)}
            </button>
          ) : (
            <button onClick={connect} className="text-sm bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-md transition">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
