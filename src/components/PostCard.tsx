"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowBigUp, ArrowBigDown, MessageSquare, ExternalLink, Zap } from "lucide-react";

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
    <div className="card card-hover flex overflow-hidden">
      {/* Vote Rail */}
      <div className="flex flex-col items-center py-2 px-1.5 border-r border-border min-w-[44px]">
        <button onClick={() => vote(1)} className={`p-1 rounded transition ${myVote === 1 ? "text-upvote" : "text-text-tertiary hover:text-upvote"}`}>
          <ArrowBigUp size={20} strokeWidth={myVote === 1 ? 2.5 : 2} />
        </button>
        <span className={`text-xs font-mono font-bold my-0.5 ${myVote === 1 ? "text-upvote" : myVote === -1 ? "text-downvote" : "text-text-secondary"}`}>
          {score}
        </span>
        <button onClick={() => vote(-1)} className={`p-1 rounded transition ${myVote === -1 ? "text-downvote" : "text-text-tertiary hover:text-downvote"}`}>
          <ArrowBigDown size={20} strokeWidth={myVote === -1 ? 2.5 : 2} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          {tweet.x_author_pfp ? (
            <img src={tweet.x_author_pfp} alt="" className="w-7 h-7 rounded-full border border-border shrink-0 object-cover" loading="lazy" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
              {tweet.x_author_name?.[0] || "?"}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="font-semibold text-text-primary">{tweet.x_author_name}</span>
            <span className="text-text-tertiary">@{tweet.x_author_handle}</span>
            <span className="text-border-hover">·</span>
            <span className="text-text-tertiary">{timeAgo}</span>
          </div>
        </div>

        <Link href={`/tweet/${tweet.id}`} className="block">
          <p className="text-[14px] leading-relaxed text-text-secondary whitespace-pre-wrap break-words">
            {tweet.content}
          </p>
        </Link>

        {media.length > 0 && (
          <div className={`mt-2.5 grid gap-1.5 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {media.slice(0, 4).map((url: string, i: number) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border">
                <img src={url} alt="" className="w-full h-48 object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-2.5 flex items-center gap-0.5 text-xs">
          <Link href={`/tweet/${tweet.id}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition">
            <MessageSquare size={14} />
            <span>{comments || 0}</span>
          </Link>
          <button onClick={() => setShowTip(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-accent hover:bg-accent/10 transition font-medium">
            <Zap size={14} />
            <span>Tip</span>
          </button>
          <a href={tweet.x_url} target="_blank" rel="noopener" className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition ml-auto">
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Tip Modal */}
      {showTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTip(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-border rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Tip @{tweet.x_author_handle}</h3>
              <button onClick={() => setShowTip(false)} className="text-text-tertiary hover:text-text-primary transition">
                <span className="text-lg">&times;</span>
              </button>
            </div>

            {tipStatus === "sent" ? (
              <div className="text-center py-4">
                <p className="text-green-400 font-semibold text-sm">Tip sent!</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  {[
                    { k: 1, icon: "☕", amount: "0.01" },
                    { k: 2, icon: "🍕", amount: "0.05" },
                    { k: 3, icon: "🐸", amount: "0.1" },
                  ].map(t => (
                    <button key={t.k} onClick={() => setTipTier(t.k)} className={`flex-1 py-2.5 rounded-lg text-xs border transition ${tipTier === t.k ? "bg-accent border-accent text-white" : "bg-bg-tertiary border-border text-text-secondary hover:border-border-hover"}`}>
                      <div className="text-base mb-0.5">{t.icon}</div>
                      <div className="font-mono">{t.amount} MON</div>
                    </button>
                  ))}
                </div>
                <button onClick={sendTip} disabled={tipStatus === "loading" || tipStatus === "confirm" || tipStatus === "saving"} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 py-2.5 rounded-lg font-medium text-sm text-white transition">
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
