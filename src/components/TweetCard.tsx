"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const ESCROW = "0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3";

function getEth() { return (typeof window !== "undefined") ? (window as any).ethereum : null; }

export function TweetCard({ tweet, creatorWallet }: any) {
  const [score, setScore] = useState(0);
  const [myVote, setMyVote] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [address, setAddress] = useState<string>("");
  const [showTip, setShowTip] = useState(false);
  const [tipTier, setTipTier] = useState(1);
  const [tipStatus, setTipStatus] = useState("");

  const media = (() => {
    const raw = tweet.media_urls;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return [...new Set(JSON.parse(raw))]; } catch { return []; }
  })();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const eth = getEth();
    if (eth) {
      eth.request({ method: "eth_accounts" }).then((a: string[]) => a[0] && setAddress(a[0])).catch(() => {});
      eth.on("accountsChanged", (a: string[]) => setAddress(a[0] || ""));
    }
    fetchCounts();
  }, [tweet.id]);

  async function fetchCounts() {
    const { count: ups } = await supabase.from("tweet_votes").select("*", { count: "exact", head: true }).eq("tweet_id", tweet.id).eq("vote_type", 1);
    const { count: downs } = await supabase.from("tweet_votes").select("*", { count: "exact", head: true }).eq("tweet_id", tweet.id).eq("vote_type", -1);
    setScore((ups||0) - (downs||0));
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      const { data: v } = await supabase.from("tweet_votes").select("vote_type").eq("tweet_id", tweet.id).eq("user_id", u.user.id).single();
      setMyVote(v?.vote_type || 0);
    }
    const { count: cc } = await supabase.from("comments").select("*", { count: "exact", head: true }).eq("tweet_id", tweet.id);
    setCommentCount(cc || 0);
  }

  async function vote(type: number) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return alert("Sign in to vote");
    if (myVote === type) {
      await supabase.from("tweet_votes").delete().eq("tweet_id", tweet.id).eq("user_id", u.user.id);
      setMyVote(0);
    } else {
      await supabase.from("tweet_votes").upsert({ tweet_id: tweet.id, user_id: u.user.id, vote_type: type });
      setMyVote(type);
    }
    fetchCounts();
  }

  async function connectWallet() {
    const eth = getEth();
    if (!eth) return alert("No wallet found. Install MetaMask or Rabby.");
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);
      try { await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x279F" }] }); }
      catch (e: any) {
        if (e.code === 4902) await eth.request({ method: "wallet_addEthereumChain", params: [{
          chainId: "0x279F", chainName: "Monad Testnet",
          nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
          rpcUrls: ["https://testnet-rpc.monad.xyz"],
          blockExplorerUrls: ["https://testnet.monadscan.com"],
        }]});
      }
    } catch (e: any) { alert("Connect failed: " + e.message); }
  }

  async function sendTip() {
    const eth = getEth();
    if (!eth || !address) return alert("Connect wallet first!");
    setTipStatus("preparing...");
    try {
      const res = await fetch("/api/tip-amount?tier=" + tipTier);
      const { amountWei } = await res.json();
      const to = creatorWallet || ESCROW;
      const valueHex = "0x" + BigInt(amountWei).toString(16);
      setTipStatus("confirm in wallet...");
      const txHash = await eth.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to, value: valueHex }],
      });
      setTipStatus("saving...");
      const vRes = await fetch("/api/tips", { method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ tweetId: tweet.id, txHash, fromUserId: "anon", toHandle: tweet.x_author_handle }) });
      const r = await vRes.json();
      if (vRes.ok) { setTipStatus("Sent! 🎉"); setTimeout(() => setShowTip(false), 2000); }
      else setTipStatus(r.error || "failed");
    } catch (e: any) { setTipStatus("Error: " + (e.message||"").slice(0,50)); }
  }

  const timeAgo = (() => {
    const s = Math.floor((Date.now() - new Date(tweet.posted_at).getTime()) / 1000);
    if (s < 60) return "now"; if (s < 3600) return Math.floor(s/60)+"m";
    if (s < 86400) return Math.floor(s/3600)+"h"; return Math.floor(s/86400)+"d";
  })();

  if (typeof window === "undefined") return <div className="bg-[#111118] rounded-xl p-4 border border-[#1a1a2e]">Loading...</div>;

  return (
    <div className="bg-[#111118] rounded-xl p-4 border border-[#1a1a2e] hover:border-[#27274a] transition">
      <div className="flex items-start gap-3">
        {tweet.x_author_pfp && <img src={tweet.x_author_pfp} className="w-10 h-10 rounded-full shrink-0" alt="" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{tweet.x_author_name}</span>
            <span className="text-zinc-600">· {timeAgo}</span>
          </div>
          <p className="mt-1 text-zinc-200 whitespace-pre-wrap break-words">{tweet.content}</p>
          {media.length > 0 && (
            <div className={`mt-3 grid gap-2 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {media.slice(0,4).map((url: string, i: number) => (
                <img key={i} src={url} className="rounded-lg object-cover w-full max-h-80 border border-[#1a1a2e]" alt="" loading="lazy" />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm border-t border-[#1a1a2e] pt-3">
        <button onClick={() => vote(1)} className={"px-2 py-1 rounded "+ (myVote===1?"bg-purple-600/30 text-purple-400":"text-zinc-500 hover:text-purple-400")}>▲</button>
        <span className="text-zinc-400 text-xs min-w-[1.5rem]">{score||""}</span>
        <button onClick={() => vote(-1)} className={"px-2 py-1 rounded "+ (myVote===-1?"bg-red-600/30 text-red-400":"text-zinc-500 hover:text-red-400")}>▼</button>
        <Link href={"/tweet/"+tweet.id} className="text-zinc-500 hover:text-zinc-300 ml-2">💬 {commentCount||0}</Link>
        
        {/* Inline tip button — no separate component */}
        <button onClick={() => {
          alert("Tip button clicked! " + (address ? "connected: " + address : "not connected"));
          if (!address) connectWallet();
          else setShowTip(true);
        }} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg text-sm font-medium transition cursor-pointer">💸 Tip</button>

        <Link href={tweet.x_url} target="_blank" className="text-zinc-600 hover:text-blue-400 ml-auto text-xs">X ↗</Link>
      </div>

      {/* Tip Modal */}
      {showTip && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowTip(false)}>
          <div className="bg-[#1a1a2e] border border-[#27274a] rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Tip @{tweet.x_author_handle}</h3>
            <p className="text-zinc-400 text-sm mb-4">{creatorWallet ? "Direct" : "Escrow"}</p>
            <div className="flex gap-2 mb-4">
              {[{k:1,t:"☕ 0.01"},{k:2,t:"🍕 0.05"},{k:3,t:"🐸 0.1"}].map(o => (
                <button key={o.k} onClick={() => setTipTier(o.k)}
                  className={"flex-1 py-2.5 rounded-lg text-sm font-medium transition " + (tipTier===o.k ? "bg-purple-600 text-white" : "bg-[#111118] text-zinc-400 hover:bg-[#27274a]")}>
                  {o.t} MON
                </button>
              ))}
            </div>
            <button onClick={sendTip}
              className="w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded-lg font-medium transition">
              Send Tip
            </button>
            {tipStatus && <p className="text-sm text-zinc-400 mt-3 text-center">{tipStatus}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
