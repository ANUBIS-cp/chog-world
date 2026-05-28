"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Tweet {
  id: number; x_id: string; x_author_handle: string; x_author_name: string;
  x_author_pfp: string; content: string; media_urls: any; x_url: string;
  posted_at: string; is_highlighted: boolean;
}

export function TweetCard({ tweet }: { tweet: Tweet }) {
  const [score, setScore] = useState(0);
  const [myVote, setMyVote] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [tipCount, setTipCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  // Parse media_urls — Supabase returns it as a string
  const media: string[] = (() => {
    const raw = tweet.media_urls;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw as string); } catch { return []; }
  })();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchCounts();
  }, [tweet.id]);

  async function fetchCounts() {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;

    // Score via direct count instead of RPC
    const { count: ups } = await supabase
      .from("tweet_votes")
      .select("*", { count: "exact", head: true })
      .eq("tweet_id", tweet.id)
      .eq("vote_type", 1);
    const { count: downs } = await supabase
      .from("tweet_votes")
      .select("*", { count: "exact", head: true })
      .eq("tweet_id", tweet.id)
      .eq("vote_type", -1);
    setScore((ups || 0) - (downs || 0));

    // My vote
    if (uid) {
      const { data: v } = await supabase
        .from("tweet_votes")
        .select("vote_type")
        .eq("tweet_id", tweet.id)
        .eq("user_id", uid)
        .single();
      setMyVote(v?.vote_type || 0);
    }

    // Comment count
    const { count: cc } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("tweet_id", tweet.id);
    setCommentCount(cc || 0);

    // Tip count
    const { count: tc } = await supabase
      .from("tips")
      .select("*", { count: "exact", head: true })
      .eq("tweet_id", tweet.id);
    setTipCount(tc || 0);
  }

  async function vote(type: number) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      alert("Sign in to vote");
      return;
    }
    if (myVote === type) {
      await supabase.from("tweet_votes").delete().eq("tweet_id", tweet.id).eq("user_id", u.user.id);
      setMyVote(0);
    } else {
      await supabase.from("tweet_votes").upsert({ tweet_id: tweet.id, user_id: u.user.id, vote_type: type });
      setMyVote(type);
    }
    fetchCounts();
  }

  const timeAgo = getTimeAgo(tweet.posted_at);

  return (
    <div className={`bg-[#111118] rounded-xl p-4 border ${tweet.is_highlighted ? "border-purple-500/50" : "border-[#1a1a2e]"} hover:border-[#27274a] transition`}>
      <div className="flex items-start gap-3">
        {tweet.x_author_pfp && (
          <img src={tweet.x_author_pfp} className="w-10 h-10 rounded-full shrink-0" alt="" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="font-semibold text-zinc-200">{tweet.x_author_name}</span>
            <span className="text-zinc-500">@{tweet.x_author_handle}</span>
            <span className="text-zinc-600">· {timeAgo}</span>
            {tweet.is_highlighted && <span className="text-yellow-400 text-xs">⭐ Highlight</span>}
          </div>
          <p className="mt-1.5 text-zinc-200 whitespace-pre-wrap break-words leading-relaxed">{tweet.content}</p>
          {media.length > 0 && (
            <div className={`mt-3 grid gap-2 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {media.slice(0, 4).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  className="rounded-lg object-cover w-full max-h-80 border border-[#1a1a2e]"
                  alt=""
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm border-t border-[#1a1a2e] pt-3">
        <button
          onClick={() => vote(1)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${
            myVote === 1 ? "bg-purple-600/30 text-purple-400" : "text-zinc-500 hover:text-purple-400 hover:bg-purple-600/10"
          }`}
        >
          ▲ {score > 0 ? score : score < 0 ? "" : ""}
        </button>
        <span className="text-zinc-400 min-w-[1rem]">{score !== 0 ? score : ""}</span>
        <button
          onClick={() => vote(-1)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${
            myVote === -1 ? "bg-red-600/30 text-red-400" : "text-zinc-500 hover:text-red-400 hover:bg-red-600/10"
          }`}
        >
          ▼
        </button>
        <Link href={`/tweet/${tweet.id}`} className="text-zinc-500 hover:text-zinc-300 transition ml-2">
          💬 {commentCount || 0}
        </Link>
        <Link href={`/tweet/${tweet.id}`} className="text-zinc-500 hover:text-purple-400 transition">
          💸 Tip {tipCount > 0 ? `(${tipCount})` : ""}
        </Link>
        <Link
          href={tweet.x_url}
          target="_blank"
          className="text-zinc-500 hover:text-blue-400 transition ml-auto text-xs"
        >
          View on X ↗
        </Link>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
