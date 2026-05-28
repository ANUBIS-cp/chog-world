"use client";
import { useState, useEffect } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

const TIERS = [
  { key: 1, label: "0.01 MON", emoji: "☕" },
  { key: 2, label: "0.05 MON", emoji: "🍕" },
  { key: 3, label: "0.1 MON",  emoji: "🐸" },
];
const ESCROW = "0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3";

export function TipButton({ tweetId, toHandle, toName, creatorWallet }: any) {
  const { address, isConnected } = useAccount();
  const { data: txHash, sendTransaction, isPending } = useSendTransaction();
  const [showModal, setShowModal] = useState(false);
  const [tier, setTier] = useState(1);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (txHash) verifyTip(txHash);
  }, [txHash]);

  async function handleTip() {
    if (!address) return alert("Connect wallet first");
    setStatus("loading amount...");
    try {
      const res = await fetch("/api/tip-amount?tier=" + tier);
      const { amountWei } = await res.json();
      const to = creatorWallet || ESCROW;
      setStatus("confirm in wallet...");
      sendTransaction({ to, value: BigInt(amountWei) });
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
  }

  async function verifyTip(hash: string) {
    setStatus("verifying on Monad...");
    try {
      const res = await fetch("/api/tips", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetId, txHash: hash, fromUserId: "anon", toHandle,
          isDirect: !!creatorWallet, creatorAddress: creatorWallet || null }),
      });
      const r = await res.json();
      if (res.ok) { setStatus("Sent! 🎉"); setTimeout(() => setShowModal(false), 2000); }
      else setStatus(r.error || "verify failed");
    } catch { setStatus("verify error"); }
  }

  return (
    <>
      <button onClick={() => setShowModal(true)}
        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">
        💸 Tip
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}>
          <div className="bg-[#1a1a2e] border border-[#27274a] rounded-xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Tip @{toHandle}</h3>
            <p className="text-zinc-400 text-sm mb-4">
              {creatorWallet ? "Sends directly to creator" : "Held in escrow until creator claims"}
            </p>
            <div className="flex gap-2 mb-4">
              {TIERS.map(t => (
                <button key={t.key} onClick={() => setTier(t.key)}
                  className={"flex-1 py-2 rounded-lg text-sm font-medium transition " + (tier === t.key
                    ? "bg-purple-600 text-white" : "bg-[#111118] text-zinc-400 hover:bg-[#27274a]")}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <button onClick={handleTip} disabled={!isConnected || isPending}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-2.5 rounded-lg font-medium transition">
              {!isConnected ? "Connect Wallet to Tip" : isPending ? "Confirm in Wallet..." : "Send Tip"}
            </button>
            {status && <p className="text-sm text-zinc-400 mt-3 text-center">{status}</p>}
          </div>
        </div>
      )}
    </>
  );
}
