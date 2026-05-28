"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal, flushSync } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useWallet } from "@/lib/wallet";
import Link from "next/link";
import { MessageSquare, ExternalLink, ArrowBigUp, ArrowBigDown, Zap } from "lucide-react";
import { toast } from "sonner";

const ESCROW = "0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3";
const TIERS = [
  { k: 1, label: "☕", amount: "0.01" },
  { k: 2, label: "🍕", amount: "0.05" },
  { k: 3, label: "🐸", amount: "0.1" },
];

function getEth() {
  return typeof window !== "undefined" ? (window as any).ethereum : null;
}

export function TweetCard({ tweet, creatorWallet }: any) {
  const { address, connect } = useWallet();
  const [score, setScore] = useState(0);
  const [myVote, setMyVote] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [showTip, setShowTipState] = useState(false);
  const [tipTier, setTipTier] = useState(1);
  const [tipStatus, setTipStatus] = useState("");
  const [isVoting, setIsVoting] = useState(false);
  const ethListenersRef = useRef<(() => void)[]>([]);

  const media = (() => {
    const raw = tweet.media_urls;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return [...new Set(JSON.parse(raw))]; } catch { return []; }
  })();

  // Safe setShowTip with flushSync to force synchronous render
  const setShowTip = useCallback((v: boolean) => {
    flushSync(() => {
      setShowTipState(v);
    });
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const [{ count: ups }, { count: downs }, { count: cc }] = await Promise.all([
        supabase.from("tweet_votes").select("*", { count: "exact", head: true }).eq("tweet_id", tweet.id).eq("vote_type", 1),
        supabase.from("tweet_votes").select("*", { count: "exact", head: true }).eq("tweet_id", tweet.id).eq("vote_type", -1),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("tweet_id", tweet.id),
      ]);
      setScore((ups || 0) - (downs || 0));
      setCommentCount(cc || 0);

      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: v } = await supabase.from("tweet_votes").select("vote_type").eq("tweet_id", tweet.id).eq("user_id", u.user.id).single();
        setMyVote(v?.vote_type || 0);
      }
    } catch (e) {
      console.error("fetchCounts error:", e);
    }
  }, [tweet.id]);

  useEffect(() => {
    fetchCounts();

    const eth = getEth();
    if (eth) {
      eth.request({ method: "eth_accounts" })
        .then((a: string[]) => a[0] && setAddressLocal(a[0]))
        .catch(() => {});

      const onAccounts = (a: string[]) => setAddressLocal(a[0] || "");
      eth.on("accountsChanged", onAccounts);
      ethListenersRef.current.push(() => eth.removeListener("accountsChanged", onAccounts));
    }

    return () => {
      ethListenersRef.current.forEach(cleanup => cleanup());
      ethListenersRef.current = [];
    };
  }, [tweet.id, fetchCounts]);

  const [localAddress, setAddressLocal] = useState("");
  const effectiveAddress = address || localAddress;

  async function vote(type: number) {
    if (isVoting) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("Sign in to vote"); return; }

    setIsVoting(true);
    const optimisticVote = myVote === type ? 0 : type;
    const prevVote = myVote;
    setMyVote(optimisticVote);
    setScore(s => s + (optimisticVote - prevVote));

    try {
      if (myVote === type) {
        await supabase.from("tweet_votes").delete().eq("tweet_id", tweet.id).eq("user_id", u.user.id);
      } else {
        await supabase.from("tweet_votes").upsert(
          { tweet_id: tweet.id, user_id: u.user.id, vote_type: type },
          { onConflict: "tweet_id,user_id" }
        );
      }
    } catch (e) {
      setMyVote(prevVote);
      setScore(s => s - (optimisticVote - prevVote));
      toast.error("Vote failed");
    } finally {
      setIsVoting(false);
      fetchCounts();
    }
  }

  async function handleTipClick() {
    if (!effectiveAddress) {
      await connect();
      return;
    }
    setShowTip(true);
  }

  async function sendTip() {
    const eth = getEth();
    if (!eth || !effectiveAddress) { toast.error("Connect wallet first!"); return; }

    setTipStatus("preparing");
    try {
      const res = await fetch("/api/tip-amount?tier=" + tipTier);
      if (!res.ok) throw new Error("Failed to get tip amount");
      const { amountWei } = await res.json();
      const to = creatorWallet || ESCROW;
      const valueHex = "0x" + BigInt(amountWei).toString(16);

      setTipStatus("confirm");
      const txHash = await eth.request({
        method: "eth_sendTransaction",
        params: [{ from: effectiveAddress, to, value: valueHex }],
      });

      setTipStatus("saving");
      const { data: userData } = await supabase.auth.getUser();
      const vRes = await fetch("/api/tips", {
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

      if (vRes.ok) {
        setTipStatus("success");
        toast.success("Tip sent! 🎉");
        setTimeout(() => setShowTip(false), 2000);
      } else {
        const r = await vRes.json();
        throw new Error(r.error || "Failed to save tip");
      }
    } catch (e: any) {
      setTipStatus("error");
      toast.error("Tip failed: " + (e.message || "").slice(0, 80));
    }
  }

  const timeAgo = (() => {
    const s = Math.floor((Date.now() - new Date(tweet.posted_at).getTime()) / 1000);
    if (s < 60) return "now";
    if (s < 3600) return Math.floor(s / 60) + "m";
    if (s < 86400) return Math.floor(s / 3600) + "h";
    return Math.floor(s / 86400) + "d";
  })();

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="card flex"
    >
      {/* Vote Rail */}
      <div className="flex flex-col items-center py-3 px-2 border-r border-[#252534] min-w-[48px]">
        <motion.button
          whileTap={{ scale: 1.2 }}
          onClick={() => vote(1)}
          disabled={isVoting}
          className={`p-1 rounded-lg transition-colors ${
            myVote === 1 ? "text-[#7C5CFF]" : "text-[#6B7280] hover:text-[#7C5CFF]"
          }`}
        >
          <ArrowBigUp size={24} fill={myVote === 1 ? "#7C5CFF" : "none"} />
        </motion.button>
        <span className={`text-sm font-mono font-bold my-0.5 ${
          myVote === 1 ? "text-[#7C5CFF]" : myVote === -1 ? "text-[#EF4444]" : "text-[#9CA3AF]"
        }`}>
          {score}
        </span>
        <motion.button
          whileTap={{ scale: 1.2 }}
          onClick={() => vote(-1)}
          disabled={isVoting}
          className={`p-1 rounded-lg transition-colors ${
            myVote === -1 ? "text-[#EF4444]" : "text-[#6B7280] hover:text-[#EF4444]"
          }`}
        >
          <ArrowBigDown size={24} fill={myVote === -1 ? "#EF4444" : "none"} />
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start gap-3">
          {tweet.x_author_pfp && (
            <img
              src={tweet.x_author_pfp}
              className="w-9 h-9 rounded-full shrink-0 border border-[#252534]"
              alt=""
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="font-semibold text-[#F0F0F5]">{tweet.x_author_name}</span>
              <span className="text-[#6B7280]">@{tweet.x_author_handle}</span>
              <span className="text-[#4B5563]">·</span>
              <span className="text-[#6B7280]">{timeAgo}</span>
            </div>
            <Link href={"/tweet/" + tweet.id} className="block mt-1.5">
              <p className="text-[15px] leading-relaxed text-[#E4E4E7] whitespace-pre-wrap break-words">
                {tweet.content}
              </p>
            </Link>
            {media.length > 0 && (
              <div className={`mt-3 grid gap-2 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                {media.slice(0, 4).map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    className="rounded-xl object-cover w-full max-h-72 border border-[#252534]"
                    alt=""
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1 text-sm">
          <Link
            href={"/tweet/" + tweet.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#6B7280] hover:text-[#9CA3AF] hover:bg-[#1A1A24] transition-colors"
          >
            <MessageSquare size={16} />
            <span className="font-mono text-xs">{commentCount || 0}</span>
          </Link>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleTipClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#7C5CFF] hover:bg-[#7C5CFF]/10 transition-colors font-medium"
          >
            <Zap size={16} />
            <span>Tip</span>
          </motion.button>

          <a
            href={tweet.x_url}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[#6B7280] hover:text-[#9CA3AF] hover:bg-[#1A1A24] transition-colors ml-auto"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline text-xs">X</span>
          </a>
        </div>
      </div>

      {/* Tip Modal via Portal */}
      <AnimatePresence>
        {showTip && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[100] flex items-center justify-center p-4"
            style={{ isolation: "isolate" }}
            onClick={() => setShowTip(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#13131A] border border-[#252534] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {tipStatus === "success" ? (
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-16 h-16 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Zap size={32} className="text-[#22C55E]" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-[#22C55E]">Tip Sent! 🎉</h3>
                  <p className="text-sm text-[#6B7280] mt-1">@{tweet.x_author_handle} thanks you</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-1">Tip @{tweet.x_author_handle}</h3>
                  <p className="text-[#6B7280] text-sm mb-5">
                    {creatorWallet ? "Direct to creator" : "Held in escrow"}
                  </p>

                  <div className="flex gap-2 mb-5">
                    {TIERS.map((o) => (
                      <button
                        key={o.k}
                        onClick={() => setTipTier(o.k)}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                          tipTier === o.k
                            ? "bg-[#7C5CFF] border-[#7C5CFF] text-white shadow-lg shadow-[#7C5CFF]/20"
                            : "bg-[#1A1A24] border-[#252534] text-[#9CA3AF] hover:border-[#3A3A50]"
                        }`}
                      >
                        <div className="text-lg">{o.label}</div>
                        <div className="text-xs opacity-80">{o.amount} MON</div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={sendTip}
                    disabled={tipStatus === "preparing" || tipStatus === "confirm" || tipStatus === "saving"}
                    className="w-full btn-primary py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {tipStatus === "preparing" && <span className="animate-spin">⟳</span>}
                    {tipStatus === "confirm" && <span className="animate-spin">⟳</span>}
                    {tipStatus === "saving" && <span className="animate-spin">⟳</span>}
                    {tipStatus === "error" ? "Retry Tip" : tipStatus === "preparing" ? "Preparing..." : tipStatus === "confirm" ? "Confirm in wallet..." : tipStatus === "saving" ? "Saving..." : "Send Tip"}
                  </button>

                  {tipStatus === "error" && (
                    <p className="text-sm text-[#EF4444] mt-3 text-center">Something went wrong. Try again.</p>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </motion.article>
  );
}
