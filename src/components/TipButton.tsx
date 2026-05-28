"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet";
import { supabase } from "@/lib/supabase";

const TIERS = [ { key: 1, label: "0.01 MON", emoji: "☕" }, { key: 2, label: "0.05 MON", emoji: "🍕" }, { key: 3, label: "0.1 MON", emoji: "🐸" } ];
const ESCROW = "0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3";

export function TipButton({ tweetId, toHandle, toName, creatorWallet }: any) {
  const { address, sendTx } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [tier, setTier] = useState(1);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");

  async function handleTip() {
    if (!address) return alert("Connect wallet first!");
    setStatus("loading...");
    try {
      const res = await fetch("/api/tip-amount?tier=" + tier);
      const { amountWei } = await res.json();
      const to = creatorWallet || ESCROW;
      setStatus("confirm in wallet...");
      const hash = await sendTx(to, amountWei);
      setTxHash(hash);
      setStatus("verifying...");
      await verify(hash);
    } catch (e: any) {
      setStatus("Error: " + (e.message || e).slice(0, 60));
    }
  }

  async function verify(hash: string) {
    try {
      const res = await fetch("/api/tips", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetId, txHash: hash, fromUserId: "anon", toHandle,
          isDirect: !!creatorWallet, creatorAddress: creatorWallet || null }),
      });
      const r = await res.json();
      if (res.ok) { setStatus("Sent! 🎉"); setTimeout(() => setShowModal(false), 2000); }
      else setStatus(r.error || "failed");
    } catch { setStatus("verify error"); }
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">💸 Tip</button>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#1a1a2e] border border-[#27274a] rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Tip @{toHandle}</h3>
            <p className="text-zinc-400 text-sm mb-4">{creatorWallet ? "Direct to creator" : "Escrow until claimed"}</p>
            <div className="flex gap-2 mb-4">
              {TIERS.map(t => (
                <button key={t.key} onClick={() => setTier(t.key)}
                  className={"flex-1 py-2 rounded-lg text-sm font-medium transition " + (tier === t.key ? "bg-purple-600 text-white" : "bg-[#111118] text-zinc-400 hover:bg-[#27274a]")}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <button onClick={handleTip} disabled={!address}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-2.5 rounded-lg font-medium transition">
              {!address ? "Connect Wallet to Tip" : "Send Tip"}
            </button>
            {status && <p className="text-sm text-zinc-400 mt-3 text-center">{status}</p>}
          </div>
        </div>
      )}
    </>
  );
}
