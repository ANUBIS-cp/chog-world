"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TweetCard } from "@/components/TweetCard";

export default function Home() {
  const [tweets, setTweets] = useState<any[]>([]);
  const [sort, setSort] = useState<"hot"|"new">("hot");
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("profiles").select("x_handle,wallet_address").then(({ data }) => {
      const map: Record<string,string> = {};
      if (data) data.forEach((p:any) => { if (p.x_handle && p.wallet_address) map[p.x_handle.toLowerCase()] = p.wallet_address; });
      setWallets(map);
    });
    fetchFeed();
  }, [sort]);

  async function fetchFeed() {
    setLoading(true);
    let q = supabase.from("tweets").select("*");
    if (sort === "new") q = q.order("posted_at", { ascending: false });
    else q = q.gte("posted_at", new Date(Date.now()-86400000).toISOString());
    const { data } = await q.limit(50);
    if (data) setTweets(sort==="hot" ? [...data].sort((a,b) => (b.likes_count+b.retweets_count)-(a.likes_count+a.retweets_count)) : data);
    setLoading(false);
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{sort==="hot"?"🔥 Hot Chog Tweets":"🆕 Latest"}</h1>
        <div className="flex gap-1 bg-[#111118] rounded-lg p-0.5">
          {(["hot","new"] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={"px-3 py-1 text-sm rounded-md "+ (sort===s?"bg-purple-600 text-white":"text-zinc-500 hover:text-white")}>{s==="hot"?"Hot":"New"}</button>
          ))}
        </div>
      </div>
      {loading ? <div className="text-center text-zinc-600 py-20">Loading...</div> :
       tweets.length===0 ? <div className="text-center text-zinc-600 py-20"><p className="text-lg">No tweets yet</p></div> :
       <div className="space-y-4">{tweets.map(t => <TweetCard key={t.id} tweet={t} creatorWallet={wallets[t.x_author_handle?.toLowerCase()] || null} />)}</div>}
    </div>
  );
}
