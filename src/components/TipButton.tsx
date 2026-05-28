"use client";
import { useState } from "react";
import { useAccount, useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import { monadTestnet } from "@/lib/wagmi";
import { supabase } from "@/lib/supabase";

const TIERS = [
  { key: 1, label: "0.01 MON", display: "☕" },
  { key: 2, label: "0.05 MON", display: "🍕" },
  { key: 3, label: "0.1 MON",  display: "🐸" },
];

const ESCROW_CONTRACT = "0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3";

function TipButton({ tweetId, toHandle, toName, creatorWallet }: any) {
  const { address, isConnected } = useAccount();
  const { sendTransaction } = useSendTransaction();
  const [showModal, setShowModal] = useState(false);
  const [tier, setTier] = useState(1);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");

  async function handleTip() {
    if (!address) return;
    setStatus("confirming");
    const res = await fetch("/api/tip-amount?tier=" + tier);
    const { amountWei } = await res.json();
    const to = creatorWallet || ESCROW_CONTRACT;
    sendTransaction({
      to: to,
      value: BigInt(amountWei),
      chainId: monadTestnet.id,
    });
  }

  async function verifyAndSave() {
    if (!txHash || !address) return;
    setStatus("verifying");
    const { data: user } = await supabase.auth.getUser();
    const res = await fetch("/api/tips", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetId, txHash, fromUserId: user.user?.id, toHandle, isDirect: !!creatorWallet, creatorAddress: creatorWallet || null }),
    });
    const result = await res.json();
    if (res.ok) {
      setStatus("sent!");
      setTimeout(() => setShowModal(false), 1500);
    } else {
      setStatus("failed: " + (result.error || "unknown"));
    }
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">💸 Tip</button>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#1a1a2e] border border-[#27274a] rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Tip @{toHandle}</h3>
            <p className="text-zinc-400 text-sm mb-4">{creatorWallet ? "Direct to creator" : "Escrow until claimed"}</p>
            <div className="flex gap-2 mb-4">
              {TIERS.map(t => (
                <button key={t.key} onClick={() => setTier(t.key)}
                  className={"flex-1 py-2 rounded-lg text-sm font-medium transition " + (tier === t.key ? "bg-purple-600 text-white" : "bg-[#111118] text-zinc-400 hover:bg-[#27274a]")}>
                  {t.display} {t.label}
                </button>
              ))}
            </div>
            {!txHash ? (
              <button onClick={handleTip} disabled={!isConnected}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-2 rounded-lg font-medium transition">
                {!isConnected ? "Connect Wallet to Tip" : "Send Tip"}
              </button>
            ) : (
              <button onClick={verifyAndSave} className="w-full bg-green-600 hover:bg-green-500 py-2 rounded-lg font-medium transition">Verify & Save</button>
            )}
            {status && <p className="text-sm text-zinc-400 mt-2 text-center">{status}</p>}
          </div>
        </div>
      )}
    </>
  );
}

export { TipButton };
