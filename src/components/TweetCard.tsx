"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const ESCROW = "0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3";

function getEth() { return typeof window !== "undefined" ? (window as any).ethereum : null; }

export function TweetCard({ tweet, creatorWallet }: any) {
  const { address } = useWallet();
  const [score, setScore] = useState(0);
  const [myVote, setMyVote] = useState(0);
  const [comments, setComments] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [tipTier, setTipTier] = useState(1);
  const [tipStatus, setTipStatus] = useState("");

  const media = (() => {
    const raw = tweet.media_urls;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return [...new Set(JSON.parse(raw))]; } catch { return []; }
  })();

  const timeAgo = (() => {
    const s = Math.floor((Date.now() - new Date(tweet.posted_at).getTime()) / 1000);
    if (s < 60) return "now";
    if (s < 3600) return Math.floor(s/60) + "m";
    if (s < 86400) return Math.floor(s/3600) + "h";
    return Math.floor(s/86400) + "d";
  })();

  useEffect(() => {
    loadVotes();
    loadComments();
  }, [tweet.id]);

  async function loadVotes() {
    const [{ count: u }, { count: d }] = await Promise.all([
      supabase.from("tweet_votes").select("*", { count: "exact", head: true }).eq("tweet_id", tweet.id).eq("vote_type", 1),
      supabase.from("tweet_votes").select("*", { count: "exact", head: true }).eq("tweet_id", tweet.id).eq("vote_type", -1),
    ]);
    setScore((u || 0) - (d || 0));
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { data: v } = await supabase.from("tweet_votes").select("vote_type").eq("tweet_id", tweet.id).eq("user_id", auth.user.id).single();
      setMyVote(v?.vote_type || 0);
    }
  }

  async function loadComments() {
    const { count } = await supabase.from("comments").select("*", { count: "exact", head: true }).eq("tweet_id", tweet.id);
    setComments(count || 0);
  }

  async function vote(type: number) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { alert("Sign in to vote"); return; }
    if (myVote === type) {
      await supabase.from("tweet_votes").delete().eq("tweet_id", tweet.id).eq("user_id", auth.user.id);
      setMyVote(0);
      setScore(s => s - type);
    } else {
      await supabase.from("tweet_votes").upsert({ tweet_id: tweet.id, user_id: auth.user.id, vote_type: type }, { onConflict: "tweet_id,user_id" });
      setMyVote(type);
      setScore(s => s + type - myVote);
    }
  }

  async function sendTip() {
    const eth = getEth();
    if (!eth || !address) { alert("Connect wallet first"); return; }
    setTipStatus("loading");
    try {
      const res = await fetch("/api/tip-amount?tier=" + tipTier);
      const { amountWei } = await res.json();
      const to = creatorWallet || ESCROW;
      const valueHex = "0x" + BigInt(amountWei).toString(16);
      setTipStatus("confirm");
      const txHash = await eth.request({ method: "eth_sendTransaction", params: [{ from: address, to, value: valueHex }] });
      setTipStatus("saving");
      const { data: u } = await supabase.auth.getUser();
      await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetId: tweet.id, txHash, fromUserId: u.user?.id || "anon", toHandle: tweet.x_author_handle, amountWei }),
      });
      setTipStatus("sent");
      setTimeout(() => setShowTip(false), 1500);
    } catch (e: any) {
      setTipStatus("error: " + (e.message || "").slice(0, 50));
    }
  }

  return (
    <div className="bg-[#13131A] border border-[#1E1E2E] rounded-xl overflow-hidden hover:border-[#2A2A40] transition">
      <div className="flex">
        {/* Vote rail */}
        <div className="flex flex-col items-center py-2 px-1.5 border-r border-[#1E1E2E] min-w-[44px]">
          <button onClick={() => vote(1)} className={`text-lg leading-none p-1 rounded transition ${myVote === 1 ? "text-[#7C5CFF]" : "text-[#4B5563] hover:text-[#7C5CFF]"}`}>▲</button>
          <span className={`text-xs font-mono font-bold my-0.5 ${myVote === 1 ? "text-[#7C5CFF]" : myVote === -1 ? "text-[#EF4444]" : "text-[#9CA3AF]"}`}>{score}</span>
          <button onClick={() => vote(-1)} className={`text-lg leading-none p-1 rounded transition ${myVote === -1 ? "text-[#EF4444]" : "text-[#4B5563] hover:text-[#EF4444]"}`}>▼</button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            {tweet.x_author_pfp && <img src={tweet.x_author_pfp} className="w-7 h-7 rounded-full border border-[#252534] shrink-0 object-cover" alt="" loading="lazy" />}
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <span className="font-semibold text-[#F0F0F5]">{tweet.x_author_name}</span>
              <span className="text-[#4B5563]">@{tweet.x_author_handle}</span>
              <span className="text-[#3A3A50]">·</span>
              <span className="text-[#4B5563]">{timeAgo}</span>
            </div>
          </div>

          <Link href={"/tweet/" + tweet.id} className="block">
            <p className="text-[14px] leading-relaxed text-[#D1D5DB] whitespace-pre-wrap break-words">{tweet.content}</p>
          </Link>

          {media.length > 0 && (
            <div className={`mt-2.5 grid gap-1.5 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {media.slice(0,4).map((url: string, i: number) => (
                <div key={i} className="overflow-hidden rounded-lg border border-[#252534]">
                  <img src={url} className="w-full h-48 object-cover" alt="" loading="lazy" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-2.5 flex items-center gap-0.5 text-xs">
            <Link href={"/tweet/" + tweet.id} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[#4B5563] hover:text-[#9CA3AF] hover:bg-[#1A1A24] transition">
              💬 {comments || 0}
            </Link>
            <button onClick={() => setShowTip(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[#7C5CFF] hover:bg-[#7C5CFF]/10 transition font-medium">
              💸 Tip
            </button>
            <a href={tweet.x_url} target="_blank" rel="noopener" className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[#4B5563] hover:text-[#9CA3AF] hover:bg-[#1A1A24] transition ml-auto">↗</a>
          </div>
        </div>
      </div>

      {/* Inline tip modal - NO portal, NO context */}
      {showTip && (
        <div className="relative z-50">
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowTip(false)}>
            <div className="bg-[#1A1A24] border border-[#2A2A40] rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Tip @{tweet.x_author_handle}</h3>
                <button onClick={() => setShowTip(false)} className="text-[#4B5563] hover:text-[#F0F0F5]">✕</button>
              </div>

              {tipStatus === "sent" ? (
                <div className="text-center py-3">
                  <p className="text-[#22C55E] font-semibold">Tip sent! 🎉</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    {[{k:1,l:"☕",a:"0.01"},{k:2,l:"🍕",a:"0.05"},{k:3,l:"🐸",a:"0.1"}].map(t => (
                      <button key={t.k} onClick={() => setTipTier(t.k)} className={`flex-1 py-2 rounded-lg text-sm border transition ${tipTier===t.k?"bg-[#7C5CFF] border-[#7C5CFF] text-white":"bg-[#13131A] border-[#252534] text-[#9CA3AF] hover:border-[#3A3A50]"}`}>
                        <div className="text-base">{t.l}</div>
                        <div className="text-[11px] opacity-70">{t.a} MON</div>
                      </button>
                    ))}
                  </div>
                  <button onClick={sendTip} disabled={tipStatus==="loading"||tipStatus==="confirm"||tipStatus==="saving"} className="w-full bg-[#7C5CFF] hover:bg-[#8B6DFF] disabled:opacity-50 py-2.5 rounded-lg font-medium text-sm transition">
                    {tipStatus === "loading" ? "Loading..." : tipStatus === "confirm" ? "Confirm in wallet..." : tipStatus === "saving" ? "Saving..." : tipStatus.startsWith("error") ? "Retry" : "Send Tip"}
                  </button>
                  {tipStatus.startsWith("error") && <p className="text-xs text-[#EF4444] mt-2 text-center">{tipStatus}</p>}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
