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
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    }).catch(() => {
      // Fallback to email if Google not configured
      supabase.auth.signInWithOAuth({ provider: "google", options: { queryParams: { access_type: "offline", prompt: "consent" } } }).catch(async () => {
        const email = prompt("Enter your email to sign in:");
        if (email) {
          await supabase.auth.signInWithOtp({ email });
        }
      });
    });
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
              <Link href="/profile" className="text-sm text-zinc-400 hover:text-white transition">
                Profile
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-zinc-500 hover:text-red-400 transition"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={signIn}
              className="text-sm bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-md transition"
            >
              Sign In
            </button>
          )}
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="address"
          />
        </div>
      </div>
    </nav>
  );
}
