"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet";
import { supabase } from "@/lib/supabase";

const TIERS = [
  { key: 1, label: "0.01 MON", emoji: "☕" },
  { key: 2, label: "0.05 MON", emoji: "🍕" },
  { key: 3, label: "0.1 MON",  emoji: "🐸" },
];
const ESCROW = "0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3";

export function TipButton({ tweetId, toHandle, toName, creatorWallet }: any) {
  const wallet = useWallet();
  const address = wallet?.address;
  const sendTx = wallet?.sendTx;
  const [showModal, setShowModal] = useState(false);
  const [tier, setTier] = useState(1);
  const [status, setStatus] = useState("");

  function openModal() {
    console.log("TipButton: openModal called");
    setShowModal(true);
  }

  async function handleTip() {
    console.log("TipButton: handleTip called, address:", address);
    if (!address) { alert("Connect wallet first!"); return; }
    if (!sendTx) { alert("Wallet sendTx not available"); return; }
    
    setStatus("loading...");
    try {
      const res = await fetch("/api/tip-amount?tier=" + tier);
      const { amountWei } = await res.json();
      const to = creatorWallet || ESCROW;
      console.log("TipButton: sending", amountWei, "to", to);
      setStatus("confirm in wallet...");
      const hash = await sendTx(to, amountWei);
      console.log("TipButton: tx hash", hash);
      setStatus("verifying...");
      const verifyRes = await fetch("/api/tips", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetId, txHash: hash, fromUserId: "anon", toHandle,
          isDirect: !!creatorWallet, creatorAddress: creatorWallet || null }),
      });
      const r = await verifyRes.json();
      if (verifyRes.ok) { setStatus("Sent!"); setTimeout(() => setShowModal(false), 2000); }
      else setStatus(r.error || "failed");
    } catch (e: any) {
      console.error("TipButton error:", e);
      setStatus("Error: " + (e.message || e).slice(0, 50));
    }
  }

  return (
    <>
      <button onClick={openModal}
        className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg text-sm font-medium transition">
        💸 Tip
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}>
          <div className="bg-[#1a1a2e] border border-[#27274a] rounded-xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Tip @{toHandle}</h3>
            <p className="text-zinc-400 text-sm mb-4">{creatorWallet ? "Direct" : "Escrow"}</p>
            <div className="flex gap-2 mb-4">
              {TIERS.map(t => (
                <button key={t.key} onClick={() => setTier(t.key)}
                  className={"flex-1 py-2.5 rounded-lg text-sm font-medium transition " + (tier === t.key
                    ? "bg-purple-600 text-white" : "bg-[#111118] text-zinc-400 hover:bg-[#27274a]")}>
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
