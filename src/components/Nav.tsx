"use client";
import Link from "next/link";
import { useWallet } from "@/lib/wallet";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function Nav() {
  const { address, connect, disconnect } = useWallet();
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && setUser(data.session.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub?.subscription.unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-[#0B0B0F]/90 backdrop-blur border-b border-[#1E1E2E]">
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">🐸 Chog World</Link>
        <div className="flex items-center gap-2">
          {address ? (
            <button onClick={disconnect} className="text-xs bg-[#1A1A24] border border-[#252534] px-3 py-1.5 rounded-lg hover:border-[#3A3A50] transition">
              {address.slice(0, 5)}...{address.slice(-3)}
            </button>
          ) : (
            <button onClick={connect} className="text-xs bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-3 py-1.5 rounded-lg hover:bg-[#22C55E]/20 transition">
              Connect
            </button>
          )}
          {user ? (
            <button onClick={() => supabase.auth.signOut()} className="text-xs text-[#EF4444] px-3 py-1.5 hover:bg-[#1A1A24] rounded-lg transition">
              Sign Out
            </button>
          ) : (
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })} className="text-xs bg-[#7C5CFF] text-white px-3 py-1.5 rounded-lg hover:bg-[#8B6DFF] transition">
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
