"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TipButton } from "@/components/TipButton";
import Link from "next/link";

export function TweetCard({ tweet, creatorWallet }: any) {
  const [score, setScore] = useState(0);
  const [myVote, setMyVote] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [commentCount, setCommentCount] = useState(0);

  const media = (() => {
    const raw = tweet.media_urls;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return [...new Set(JSON.parse(raw))]; } catch { return []; }
  })();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
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

  const timeAgo = (() => {
    const s = Math.floor((Date.now() - new Date(tweet.posted_at).getTime()) / 1000);
    if (s < 60) return "now"; if (s < 3600) return Math.floor(s/60)+"m";
    if (s < 86400) return Math.floor(s/3600)+"h"; return Math.floor(s/86400)+"d";
  })();

  return (
    <div className="bg-[#111118] rounded-xl p-4 border border-[#1a1a2e] hover:border-[#27274a] transition">
      <div className="flex items-start gap-3">
        {tweet.x_author_pfp && <img src={tweet.x_author_pfp} className="w-10 h-10 rounded-full shrink-0" alt="" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{tweet.x_author_name}</span>
            <span className="text-zinc-600">· {timeAgo}</span>
            {tweet.is_highlighted && <span className="text-yellow-400 text-xs">⭐</span>}
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
        <TipButton tweetId={tweet.id} toHandle={tweet.x_author_handle} toName={tweet.x_author_name} creatorWallet={creatorWallet} />
        <Link href={tweet.x_url} target="_blank" className="text-zinc-600 hover:text-blue-400 ml-auto text-xs">X ↗</Link>
      </div>
    </div>
  );
}
