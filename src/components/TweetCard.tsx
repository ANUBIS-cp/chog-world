"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Tweet {
  id: number;
  x_id: string;
  x_author_handle: string;
  x_author_name: string;
  x_author_pfp: string;
  content: string;
  media_urls: string[];
  x_url: string;
  posted_at: string;
  is_highlighted: boolean;
}

export function TweetCard({ tweet }: { tweet: Tweet }) {
  const [score, setScore] = useState(0);
  const [myVote, setMyVote] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchScore();
    fetchMyVote();
  }, [tweet.id]);

  async function fetchScore() {
    const { data } = await supabase
      .rpc("tweet_score", { tweet_row: { id: tweet.id } });
    setScore(data ?? 0);
  }

  async function fetchMyVote() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("tweet_votes")
      .select("vote_type")
      .eq("tweet_id", tweet.id)
      .eq("user_id", u.user.id)
      .single();
    setMyVote(data?.vote_type ?? 0);
  }

  async function vote(type: number) {
    if (!user) return;
    if (myVote === type) {
      // Remove vote
      await supabase.from("tweet_votes").delete().eq("tweet_id", tweet.id).eq("user_id", user.id);
      setMyVote(0);
    } else {
      await supabase.from("tweet_votes").upsert({ tweet_id: tweet.id, user_id: user.id, vote_type: type });
      setMyVote(type);
    }
    fetchScore();
  }

  const media = Array.isArray(tweet.media_urls) ? tweet.media_urls : [];
  const timeAgo = getTimeAgo(tweet.posted_at);

  return (
    <div className={`bg-[#111118] rounded-xl p-4 border ${tweet.is_highlighted ? "border-purple-500/50" : "border-[#1a1a2e]"} hover:border-[#27274a] transition`}>
      <div className="flex items-start gap-3">
        {tweet.x_author_pfp && (
          <img src={tweet.x_author_pfp} className="w-10 h-10 rounded-full" alt="" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{tweet.x_author_name}</span>
            <span className="text-zinc-500">@{tweet.x_author_handle}</span>
            <span className="text-zinc-600">· {timeAgo}</span>
            {tweet.is_highlighted && <span className="text-yellow-400 text-xs">⭐ Highlight</span>}
          </div>
          <p className="mt-1 text-zinc-200 whitespace-pre-wrap break-words">{tweet.content}</p>
          {media.length > 0 && (
            <div className={`mt-3 grid gap-2 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {media.slice(0, 4).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  className="rounded-lg object-cover max-h-64 w-full"
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
            myVote === 1 ? "bg-purple-600/30 text-purple-400" : "text-zinc-500 hover:text-purple-400"
          }`}
        >
          ▲ {score > 0 ? score : ""}
        </button>
        <button
          onClick={() => vote(-1)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${
            myVote === -1 ? "bg-red-600/30 text-red-400" : "text-zinc-500 hover:text-red-400"
          }`}
        >
          ▼
        </button>
        <Link href={`/tweet/${tweet.id}`} className="text-zinc-500 hover:text-white transition">
          💬 Comments
        </Link>
        <Link
          href={tweet.x_url}
          target="_blank"
          className="text-zinc-500 hover:text-blue-400 transition ml-auto"
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
