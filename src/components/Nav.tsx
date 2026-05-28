"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function Nav() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUser(data.session.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });
    return () => sub?.subscription.unsubscribe();
  }, []);

  async function signIn() {
    const email = prompt("Enter your email to sign in:");
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) alert(error.message);
    else alert("Check your email for a magic link!");
  }

  return (
    <nav className="sticky top-7 z-50 bg-[#0a0a0f]/80 backdrop-blur border-b border-[#1a1a2e]">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-purple-400 hover:text-purple-300">
          🐸 Chog World
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-zinc-400">{user.email}</span>
              <button onClick={() => supabase.auth.signOut()} className="text-sm text-zinc-500 hover:text-red-400 transition">
                Sign Out
              </button>
            </>
          ) : (
            <button onClick={signIn} className="text-sm bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-md transition">
              Sign In
            </button>
          )}
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
        </div>
      </div>
    </nav>
  );
}
