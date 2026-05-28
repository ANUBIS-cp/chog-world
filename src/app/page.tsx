"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TweetCard } from "@/components/TweetCard";
import { TweetCardSkeleton } from "@/components/TweetCardSkeleton";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [sort, setSort] = useState<"hot"|"new"|"top">("hot");
  const [searchQuery, setSearchQuery] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [allTweets, setAllTweets] = useState<any[]>([]);
  const [wallets, setWallets] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("profiles").select("x_handle,wallet_address").then(({ data }) => {
      const map: Record<string, string> = {};
      if (data) data.forEach((p: any) => {
        if (p.x_handle && p.wallet_address) map[p.x_handle.toLowerCase()] = p.wallet_address;
      });
      setWallets(map);
    });
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["feed", sort, searchQuery, cursor],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("sort", sort);
      if (searchQuery) params.set("search", searchQuery);
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/feed?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (data?.tweets) {
      if (cursor) {
        setAllTweets(prev => [...prev, ...data.tweets]);
      } else {
        setAllTweets(data.tweets);
      }
    }
  }, [data, cursor]);

  function handleSortChange(newSort: "hot"|"new"|"top") {
    setSort(newSort);
    setCursor(null);
    setAllTweets([]);
  }

  function handleLoadMore() {
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    if (search) setSearchQuery(search);
    const sortParam = params.get("sort") as "hot"|"new"|"top";
    if (sortParam && ["hot", "new", "top"].includes(sortParam)) {
      setSort(sortParam);
    }
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">
          {searchQuery ? `Search: "${searchQuery}"` : sort === "hot" ? "🔥 Hot" : sort === "new" ? "🆕 New" : "🏆 Top"}
        </h1>
        <div className="flex gap-1 bg-[#13131A] rounded-xl p-1 border border-[#252534]">
          {(["hot", "new", "top"] as const).map(s => (
            <button
              key={s}
              onClick={() => handleSortChange(s)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                sort === s
                  ? "bg-[#7C5CFF] text-white shadow-lg shadow-[#7C5CFF]/20"
                  : "text-[#6B7280] hover:text-[#F0F0F5]"
              }`}
            >
              {s === "hot" ? "Hot" : s === "new" ? "New" : "Top"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && allTweets.length === 0 && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <TweetCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && allTweets.length === 0 && (
        <div className="text-center text-[#6B7280] py-20">
          <p className="text-lg">{searchQuery ? "No tweets found" : "No tweets yet"}</p>
        </div>
      )}

      <div className="space-y-4">
        {allTweets.map(t => (
          <TweetCard
            key={t.id}
            tweet={t}
            creatorWallet={wallets[t.x_author_handle?.toLowerCase()] || null}
          />
        ))}
      </div>

      {data?.nextCursor && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isFetching}
            className="px-6 py-2.5 rounded-xl bg-[#1A1A24] border border-[#252534] text-[#9CA3AF] hover:border-[#3A3A50] hover:text-[#F0F0F5] transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isFetching && <Loader2 size={16} className="animate-spin" />}
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
