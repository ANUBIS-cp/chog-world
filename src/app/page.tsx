"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TweetCard } from "@/components/TweetCard";

interface Tweet {
  id: number; x_id: string; x_author_handle: string; x_author_name: string;
  x_author_pfp: string; content: string; media_urls: string[]; x_url: string;
  posted_at: string; is_highlighted: boolean;
}

export default function Home() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [sort, setSort] = useState<"hot" | "new">("hot");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, [sort]);

  async function fetchFeed() {
    setLoading(true);
    let query = supabase.from("tweets").select("*");

    if (sort === "new") {
      query = query.order("posted_at", { ascending: false });
    } else {
      // Hot: last 24h, sort by engagement
      query = query.gte("posted_at", new Date(Date.now() - 86400000).toISOString());
    }

    const { data } = await query.limit(50);
    if (data) {
      // Sort by likes+retweets for "hot"
      const sorted = sort === "hot"
        ? [...data].sort((a, b) => (b.likes_count + b.retweets_count) - (a.likes_count + a.retweets_count))
        : data;
      setTweets(sorted);
    }
    setLoading(false);
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">
          {sort === "hot" ? "🔥 Hot Chog Tweets" : "🆕 Latest Chog Tweets"}
        </h1>
        <div className="flex gap-1 bg-[#111118] rounded-lg p-0.5">
          {(["hot", "new"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1 text-sm rounded-md transition ${
                sort === s ? "bg-purple-600 text-white" : "text-zinc-500 hover:text-white"
              }`}
            >
              {s === "hot" ? "Hot" : "New"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-zinc-600 py-20">Loading Chog tweets...</div>
      ) : tweets.length === 0 ? (
        <div className="text-center text-zinc-600 py-20">
          <p className="text-lg">No tweets yet</p>
          <p className="text-sm mt-2">
            Tweet about $CHOG, #chogcoin, or tag @chogNFT to appear here!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tweets.map((t) => (
            <TweetCard key={t.id} tweet={t} />
          ))}
        </div>
      )}
    </div>
  );
}
