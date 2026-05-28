"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useWallet } from "@/lib/wallet";
import { useTipModal } from "@/hooks/useTipModal";
import { supabase } from "@/lib/api";
import { toast } from "sonner";
import { X, Zap, Loader2 } from "lucide-react";

const ESCROW = "0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3";
const TIERS = [
  { k: 1, label: "Small", emoji: "☕", amount: "0.01" },
  { k: 2, label: "Medium", emoji: "🍕", amount: "0.05" },
  { k: 3, label: "Big", emoji: "🐸", amount: "0.1" },
];

function getEth() {
  return typeof window !== "undefined" ? (window as any).ethereum : null;
}

export function GlobalTipModal() {
  const { isOpen, tweet, creatorWallet, close } = useTipModal();
  const { address, connect } = useWallet();
  const [tipTier, setTipTier] = useState(1);
  const [status, setStatus] = useState<"idle" | "preparing" | "confirm" | "saving" | "success" | "error">("idle");

  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setTipTier(1);
    }
  }, [isOpen]);

  if (!isOpen || !tweet) return null;

  async function handleTip() {
    if (!address) {
      await connect();
      return;
    }

    setStatus("preparing");
    try {
      const res = await fetch("/api/tip-amount?tier=" + tipTier);
      if (!res.ok) throw new Error("Failed to get amount");
      const { amountWei } = await res.json();
      const to = creatorWallet || ESCROW;
      const valueHex = "0x" + BigInt(amountWei).toString(16);

      setStatus("confirm");
      const eth = getEth();
      if (!eth) throw new Error("No wallet");

      const txHash = await eth.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to, value: valueHex }],
      });

      setStatus("saving");
      const { data: userData } = await supabase.auth.getUser();
      const saveRes = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tweetId: tweet.id,
          txHash,
          fromUserId: userData.user?.id || "anon",
          toHandle: tweet.x_author_handle,
          amountWei,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || "Save failed");
      }

      setStatus("success");
      toast.success("Tip sent!");
      setTimeout(close, 2000);
    } catch (e: any) {
      setStatus("error");
      toast.error(e.message?.slice(0, 80) || "Tip failed");
    }
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ isolation: "isolate" }}
        onClick={close}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6 w-full max-w-[380px] shadow-2xl"
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 text-[#6B7280] hover:text-[#F0F0F5] transition-colors"
          >
            <X size={18} />
          </button>

          {status === "success" ? (
            <div className="text-center py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-16 h-16 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Zap size={32} className="text-[#22C55E]" />
              </motion.div>
              <h3 className="text-lg font-semibold text-[#22C55E]">Sent!</h3>
              <p className="text-sm text-[#6B7280] mt-1">@{tweet.x_author_handle} thanks you</p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-[#F0F0F5]">Send Tip</h3>
                <p className="text-sm text-[#6B7280] mt-0.5">
                  To @{tweet.x_author_handle}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-5">
                {TIERS.map((tier) => (
                  <button
                    key={tier.k}
                    onClick={() => setTipTier(tier.k)}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                      tipTier === tier.k
                        ? "bg-[#7C5CFF]/20 border-[#7C5CFF] text-[#7C5CFF]"
                        : "bg-[#1A1A24] border-[#2A2A3A] text-[#9CA3AF] hover:border-[#3A3A50]"
                    }`}
                  >
                    <span className="text-xl">{tier.emoji}</span>
                    <span className="text-xs">{tier.amount} MON</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleTip}
                disabled={status === "preparing" || status === "confirm" || status === "saving"}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-[#7C5CFF] hover:bg-[#8B6DFF] text-white"
              >
                {(status === "preparing" || status === "confirm" || status === "saving") && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {status === "error" ? "Try Again" :
                 status === "preparing" ? "Preparing..." :
                 status === "confirm" ? "Confirm in wallet..." :
                 status === "saving" ? "Saving..." :
                 !address ? "Connect Wallet" : "Send Tip"}
              </button>

              {status === "error" && (
                <p className="text-xs text-[#EF4444] mt-3 text-center">Something went wrong</p>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
