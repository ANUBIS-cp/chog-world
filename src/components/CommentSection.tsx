"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Comment {
  id: number;
  tweet_id: number;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { display_name: string; username: string; pfp_url: string };
  comment_votes?: { vote_type: number }[];
}

export function CommentSection({ tweetId }: { tweetId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchComments();
  }, [tweetId]);

  async function fetchComments() {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(display_name, username, pfp_url)")
      .eq("tweet_id", tweetId)
      .is("parent_id", null)
      .order("created_at", { ascending: true });
    if (data) setComments(data);
  }

  async function postComment() {
    if (!content.trim() || !user) return;
    setLoading(true);
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetId, userId: user.id, content: content.trim() }),
    });
    setContent("");
    setLoading(false);
    fetchComments();
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3">Comments</h3>

      {user ? (
        <div className="flex gap-2 mb-4">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            maxLength={500}
            className="flex-1 bg-[#1a1a2e] border border-[#27274a] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
            onKeyDown={(e) => e.key === "Enter" && postComment()}
          />
          <button
            onClick={postComment}
            disabled={loading || !content.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Post
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-600 mb-4">Sign in to comment.</p>
      )}

      {comments.map((c) => (
        <div key={c.id} className="flex gap-3 py-3 border-t border-[#1a1a2e]">
          <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center justify-center text-xs font-bold text-purple-400">
            {c.profiles?.display_name?.[0] || "?"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{c.profiles?.display_name || "User"}</span>
              <span className="text-xs text-zinc-600">@{c.profiles?.username}</span>
              <span className="text-xs text-zinc-700">{timeAgo(c.created_at)}</span>
            </div>
            <p className="text-sm text-zinc-300 mt-0.5">{c.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
