"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const ESCROW = "0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3";

function getEth() { return typeof window !== "undefined" ? (window as any).ethereum : null; }

export function PostCard({ tweet, creatorWallet }: { tweet: any; creatorWallet?: string | null }) {
  const { address } = useWallet();
  const [score, setScore] = useState(0);
  const [myVote, setMyVote] = useState(0);
  const [comments, setComments] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [tipTier, setTipTier] = useState(1);
  const [tipStatus, setTipStatus] = useState("");

  // Clean content - strip X embeds/frames
  const cleanContent = (() => {
    let text = tweet.content || "";
    // Remove iframe embeds
    text = text.replace(/<iframe[^>]*>.*?<\/iframe>/gi, "[embedded content]");
    // Remove script tags
    text = text.replace(/<script[^>]*>.*?<\/script>/gi, "");
    // Limit length for preview
    if (text.length > 280) text = text.slice(0, 277) + "...";
    return text;
  })();

  const media = (() => {
    const raw = tweet.media_urls;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return [...new Set(JSON.parse(raw))]; } catch { return []; }
  })();

  const timeAgo = (() => {
    const s = Math.floor((Date.now() - new Date(tweet.posted_at).getTime()) / 1000);
    if (s < 60) return "now";
    if (s < 3600) return Math.floor(s / 60) + "m";
    if (s < 86400) return Math.floor(s / 3600) + "h";
    return Math.floor(s / 86400) + "d";
  })();

  useEffect(() => { loadVotes(); loadComments(); }, [tweet.id]);

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
    if (!auth.user) { window.alert("Sign in to vote"); return; }
    if (myVote === type) {
      await supabase.from("tweet_votes").delete().eq("tweet_id", tweet.id).eq("user_id", auth.user.id);
      setMyVote(0);
      setScore(s => s - type);
    } else {
      await supabase.from("tweet_votes").upsert(
        { tweet_id: tweet.id, user_id: auth.user.id, vote_type: type },
        { onConflict: "tweet_id,user_id" }
      );
      setMyVote(type);
      setScore(s => s + type - myVote);
    }
  }

  async function sendTip() {
    const eth = getEth();
    if (!eth || !address) { window.alert("Connect wallet first"); return; }
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
    <div className="bg-[#13131A] border border-[#1E1E2E] rounded-xl overflow-hidden hover:border-[#2A2A40] transition-colors duration-200">
      <div className="flex">
        {/* Vote Rail */}
        <div className="flex flex-col items-center py-2 px-1.5 border-r border-[#1E1E2E] min-w-[44px]">
          <button onClick={() => vote(1)} className={`text-[15px] leading-none p-1 rounded transition ${myVote === 1 ? "text-[#FF8B60]" : "text-[#4B5563] hover:text-[#FF8B60]"}`}>
            &#9650;
          </button>
          <span className={`text-[11px] font-mono font-bold my-0.5 ${myVote === 1 ? "text-[#FF8B60]" : myVote === -1 ? "text-[#9494FF]" : "text-[#9CA3AF]"}`}>
            {score}
          </span>
          <button onClick={() => vote(-1)} className={`text-[15px] leading-none p-1 rounded transition ${myVote === -1 ? "text-[#9494FF]" : "text-[#4B5563] hover:text-[#9494FF]"}`}>
            &#9660;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3">
          {/* Author */}
          <div className="flex items-center gap-2 mb-1.5">
            {tweet.x_author_pfp ? (
              <img src={tweet.x_author_pfp} alt="" className="w-6 h-6 rounded-full border border-[#252534] shrink-0 object-cover" loading="lazy" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#7C5CFF]/20 flex items-center justify-center text-[9px] font-bold text-[#7C5CFF] shrink-0">
                {tweet.x_author_name?.[0] || "?"}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
              <span className="font-semibold text-[#F0F0F5]">{tweet.x_author_name}</span>
              <span className="text-[#4B5563]">@{tweet.x_author_handle}</span>
              <span className="text-[#3A3A50]">·</span>
              <span className="text-[#4B5563]">{timeAgo}</span>
            </div>
          </div>

          {/* Text */}
          <Link href={`/tweet/${tweet.id}`} className="block">
            <p className="text-[13px] leading-[1.5] text-[#D1D5DB] whitespace-pre-wrap break-words">
              {cleanContent}
            </p>
          </Link>

          {/* Media - STRICTLY constrained */}
          {media.length > 0 && (
            <div className={`mt-2 grid gap-1.5 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {media.slice(0, 4).map((url: string, i: number) => (
                <div key={i} className="relative overflow-hidden rounded-lg border border-[#252534] bg-[#0B0B0F]" style={{ maxHeight: "200px" }}>
                  <img 
                    src={url} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    style={{ maxHeight: "200px" }}
                    loading="lazy" 
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex items-center gap-0.5 text-[11px]">
            <Link href={`/tweet/${tweet.id}`} className="flex items-center gap-1 px-2 py-1 rounded-md text-[#4B5563] hover:text-[#9CA3AF] hover:bg-[#1A1A24] transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>{comments || 0}</span>
            </Link>
            <button onClick={() => setShowTip(true)} className="flex items-center gap-1 px-2 py-1 rounded-md text-[#7C5CFF] hover:bg-[#7C5CFF]/10 transition font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>Tip</span>
            </button>
            <a href={tweet.x_url} target="_blank" rel="noopener" className="flex items-center gap-1 px-2 py-1 rounded-md text-[#4B5563] hover:text-[#9CA3AF] hover:bg-[#1A1A24] transition ml-auto">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Tip Modal */}
      {showTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTip(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-[#1A1A24] border border-[#2A2A40] rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Tip @{tweet.x_author_handle}</h3>
              <button onClick={() => setShowTip(false)} className="text-[#4B5563] hover:text-[#F0F0F5] text-lg">&times;</button>
            </div>

            {tipStatus === "sent" ? (
              <div className="text-center py-4">
                <p className="text-green-400 font-semibold text-sm">Tip sent!</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  {[{k:1,l:"Small",a:"0.01"},{k:2,l:"Medium",a:"0.05"},{k:3,l:"Large",a:"0.1"}].map(t => (
                    <button key={t.k} onClick={() => setTipTier(t.k)} className={`flex-1 py-2.5 rounded-lg text-xs border transition ${tipTier===t.k?"bg-[#7C5CFF] border-[#7C5CFF] text-white":"bg-[#13131A] border-[#252534] text-[#9CA3AF] hover:border-[#3A3A50]"}`}>
                      <div className="font-medium">{t.l}</div>
                      <div className="font-mono opacity-70">{t.a} MON</div>
                    </button>
                  ))}
                </div>
                <button onClick={sendTip} disabled={tipStatus==="loading"||tipStatus==="confirm"||tipStatus==="saving"} className="w-full bg-[#7C5CFF] hover:bg-[#8B6DFF] disabled:opacity-50 py-2.5 rounded-lg font-medium text-sm text-white transition">
                  {tipStatus === "loading" ? "Loading..." : tipStatus === "confirm" ? "Confirm in wallet..." : tipStatus === "saving" ? "Saving..." : tipStatus.startsWith("error") ? "Retry" : "Send Tip"}
                </button>
                {tipStatus.startsWith("error") && <p className="text-xs text-red-400 mt-2 text-center">{tipStatus}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
