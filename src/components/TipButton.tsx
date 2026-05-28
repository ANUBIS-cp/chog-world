"use client";
import { useState, useEffect } from "react";
import { useAccount, useSendTransaction } from "wagmi";
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
  const { sendTransaction, data: txHash, isPending, isSuccess } = useSendTransaction();
  const [showModal, setShowModal] = useState(false);
  const [tier, setTier] = useState(1);
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(false);

  // Watch for tx hash
  useEffect(() => {
    if (txHash) {
      setStatus("verifying...");
      verifyAndSave(txHash);
    }
  }, [txHash]);

  async function handleTip() {
    if (!address) return;
    setStatus("confirming");
    setSaved(false);
    const res = await fetch("/api/tip-amount?tier=" + tier);
    const { amountWei } = await res.json();
    const to = creatorWallet || ESCROW_CONTRACT;
    sendTransaction({ to: to, value: BigInt(amountWei), chainId: monadTestnet.id });
  }

  async function verifyAndSave(hash: string) {
    const { data: user } = await supabase.auth.getUser();
    try {
      const res = await fetch("/api/tips", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetId, txHash: hash, fromUserId: user.user?.id, toHandle, isDirect: !!creatorWallet, creatorAddress: creatorWallet || null }),
      });
      const result = await res.json();
      if (res.ok) {
        setStatus("sent!");
        setSaved(true);
        setTimeout(() => setShowModal(false), 2000);
      } else {
        setStatus("verify failed: " + (result.error || ""));
      }
    } catch {
      setStatus("verify error");
    }
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">
        💸 Tip
      </button>
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
            <button onClick={handleTip} disabled={!isConnected || isPending}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-2 rounded-lg font-medium transition">
              {!isConnected ? "Connect Wallet to Tip" : isPending ? "Confirm in Wallet..." : isSuccess && saved ? "Done!" : "Send Tip"}
            </button>
            {status && <p className="text-sm text-zinc-400 mt-2 text-center">{status}</p>}
          </div>
        </div>
      )}
    </>
  );
}

export { TipButton };
