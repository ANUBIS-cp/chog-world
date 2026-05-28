"use client";
import { useState, useEffect } from "react";
import { PostCard } from "@/components/PostCard";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [tweets, setTweets] = useState<any[]>([]);
  const [sort, setSort] = useState("hot");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [wallets, setWallets] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("sort") || "hot";
    const q = params.get("q") || "";
    setSort(s);
    setSearch(q);
    supabase.from("profiles").select("x_handle,wallet_address").then(({ data }) => {
      const m: Record<string, string> = {};
      if (data) data.forEach((p: any) => { if (p.x_handle && p.wallet_address) m[p.x_handle.toLowerCase()] = p.wallet_address; });
      setWallets(m);
    });
    loadTweets(0, true, s, q);
  }, []);

  async function loadTweets(newOffset: number, reset: boolean, s: string, q: string) {
    setLoading(true);
    try {
      let query = supabase.from("tweets").select("*", { count: "exact" });
      if (q) query = query.or(`content.ilike.%${q}%,x_author_handle.ilike.%${q}%`);
      if (s === "new") query = query.order("posted_at", { ascending: false });
      else if (s === "top") query = query.order("likes_count", { ascending: false });
      else query = query.gte("posted_at", new Date(Date.now() - 86400000 * 7).toISOString()).order("likes_count", { ascending: false });
      query = query.range(newOffset, newOffset + 9);
      const { data, count, error } = await query;
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

  function changeSort(s: string) {
    setSort(s);
    setOffset(0);
    setTweets([]);
    window.history.replaceState({}, "", `/?sort=${s}`);
    loadTweets(0, true, s, search);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">{search ? `Search: ${search}` : sort === "hot" ? "Hot" : sort === "new" ? "New" : "Top"}</h1>
        <div className="flex gap-1 bg-[#13131A] rounded-lg p-0.5 border border-[#1E1E2E]">
          {[
            { key: "hot", label: "Hot" },
            { key: "new", label: "New" },
            { key: "top", label: "Top" },
          ].map(tab => (
            <button key={tab.key} onClick={() => changeSort(tab.key)} className={`px-3 py-1 text-xs rounded-md font-medium transition ${sort===tab.key?"bg-[#7C5CFF] text-white":"text-[#4B5563] hover:text-[#9CA3AF]"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {tweets.map(t => <PostCard key={t.id} tweet={t} creatorWallet={wallets[t.x_author_handle?.toLowerCase()] || null} />)}
      </div>

      {loading && tweets.length === 0 && (
        <div className="space-y-3 mt-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#13131A] border border-[#1E1E2E] rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && tweets.length === 0 && (
        <div className="text-center text-[#4B5563] py-20">No posts</div>
      )}

      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <button onClick={() => loadTweets(offset, false, sort, search)} className="px-5 py-2 bg-[#1A1A24] border border-[#252534] rounded-lg text-xs text-[#9CA3AF] hover:border-[#3A3A50] hover:text-[#F0F0F5] transition">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
