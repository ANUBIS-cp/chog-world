"use client";
import { useEffect, useState } from "react";
import { useFeed } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import { TweetCard } from "@/components/TweetCard";
import { TweetCardSkeleton } from "@/components/TweetCardSkeleton";
import { Flame, Clock, Trophy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [sort, setSort] = useState<"hot" | "new" | "top">("hot");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useFeed({ sort, search: searchQuery || undefined });

  const allTweets = data?.pages.flatMap((p) => p.tweets) || [];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("sort") as "hot" | "new" | "top";
    if (s && ["hot", "new", "top"].includes(s)) setSort(s);
    const q = params.get("search");
    if (q) setSearchQuery(q);
  }, []);

  function handleSortChange(s: "hot" | "new" | "top") {
    setSort(s);
    window.history.replaceState({}, "", `/?sort=${s}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {searchQuery ? `Results for "${searchQuery}"` : "Feed"}
        </h1>
        <div className="flex gap-1 bg-[#13131A] rounded-xl p-1 border border-[#252534]">
          {[
            { key: "hot" as const, icon: Flame, label: "Hot" },
            { key: "new" as const, icon: Clock, label: "New" },
            { key: "top" as const, icon: Trophy, label: "Top" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleSortChange(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                sort === tab.key
                  ? "bg-[#7C5CFF] text-white shadow-lg shadow-[#7C5CFF]/20"
                  : "text-[#6B7280] hover:text-[#9CA3AF]"
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <TweetCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-[#EF4444]">
          <p>Failed to load feed. Please refresh.</p>
        </div>
      )}

      {!isLoading && allTweets.length === 0 && (
        <div className="text-center py-20">
          <p className="text-lg text-[#6B7280]">
            {searchQuery ? "No tweets found" : "No tweets yet"}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {allTweets.map((tweet, i) => (
          <TweetCard key={tweet.id} tweet={tweet} index={i} />
        ))}
      </div>

      {hasNextPage && (
        <div className="mt-6 text-center">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-6 py-2.5 rounded-xl bg-[#1A1A24] border border-[#252534] text-[#9CA3AF] hover:border-[#3A3A50] hover:text-[#F0F0F5] transition-all disabled:opacity-50 text-sm font-medium inline-flex items-center gap-2"
          >
            {isFetchingNextPage && <Loader2 size={14} className="animate-spin" />}
            Load More
          </motion.button>
        </div>
      )}
    </div>
  );
}
