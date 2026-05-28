"use client";
import { useState, useEffect } from "react";
import { TweetCard } from "@/components/TweetCard";
import { Nav } from "@/components/Nav";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [tweets, setTweets] = useState<any[]>([]);
  const [sort, setSort] = useState("hot");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [wallets, setWallets] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("profiles").select("x_handle,wallet_address").then(({ data }) => {
      const m: Record<string, string> = {};
      if (data) data.forEach((p: any) => { if (p.x_handle && p.wallet_address) m[p.x_handle.toLowerCase()] = p.wallet_address; });
      setWallets(m);
    });
    loadTweets(0, true);
  }, [sort]);

  async function loadTweets(newOffset: number, reset: boolean) {
    setLoading(true);
    try {
      let q = supabase.from("tweets").select("*", { count: "exact" });
      if (sort === "new") q = q.order("posted_at", { ascending: false });
      else if (sort === "top") q = q.order("likes_count", { ascending: false });
      else q = q.gte("posted_at", new Date(Date.now() - 86400000 * 7).toISOString()).order("likes_count", { ascending: false });
      q = q.range(newOffset, newOffset + 9);
      const { data, count, error } = await q;
      if (error) throw error;
      if (reset) setTweets(data || []);
      else setTweets(prev => [...prev, ...(data || [])]);
      setHasMore(data?.length === 10 && (count || 0) > newOffset + 10);
      setOffset(newOffset + 10);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 pb-20 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">{sort === "hot" ? "🔥 Hot" : sort === "new" ? "🆕 New" : "🏆 Top"}</h1>
          <div className="flex gap-1 bg-[#13131A] rounded-lg p-0.5 border border-[#1E1E2E]">
            {["hot","new","top"].map(s => (
              <button key={s} onClick={() => { setSort(s); setOffset(0); setTweets([]); }} className={`px-3 py-1 text-xs rounded-md font-medium transition ${sort===s?"bg-[#7C5CFF] text-white":"text-[#4B5563] hover:text-[#9CA3AF]"}`}>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {tweets.map(t => <TweetCard key={t.id} tweet={t} creatorWallet={wallets[t.x_author_handle?.toLowerCase()] || null} />)}
        </div>

        {loading && tweets.length === 0 && (
          <div className="text-center text-[#4B5563] py-20">Loading...</div>
        )}

        {!loading && tweets.length === 0 && (
          <div className="text-center text-[#4B5563] py-20">No tweets yet</div>
        )}

        {hasMore && !loading && (
          <div className="mt-4 text-center">
            <button onClick={() => loadTweets(offset, false)} className="px-5 py-2 bg-[#1A1A24] border border-[#252534] rounded-lg text-xs text-[#9CA3AF] hover:border-[#3A3A50] hover:text-[#F0F0F5] transition">
              Load More
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
