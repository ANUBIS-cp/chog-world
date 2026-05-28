"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function CommentSection({ tweetId }: { tweetId: number }) {
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    loadComments();
  }, [tweetId]);

  async function loadComments() {
    const { data } = await supabase.from("comments").select("*, profiles(display_name, username, pfp_url)").eq("tweet_id", tweetId).order("created_at", { ascending: true });
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
    loadComments();
  }

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold text-[#4B5563] uppercase mb-2">Comments</h3>
      {user ? (
        <div className="flex gap-2 mb-3">
          <input value={content} onChange={e => setContent(e.target.value)} placeholder="Add a comment..." maxLength={500}
            className="flex-1 bg-[#1A1A24] border border-[#252534] rounded-lg px-3 py-2 text-sm text-[#F0F0F5] placeholder-[#4B5563] focus:outline-none focus:border-[#7C5CFF]/50"
            onKeyDown={e => e.key === "Enter" && postComment()} />
          <button onClick={postComment} disabled={loading || !content.trim()} className="bg-[#7C5CFF] hover:bg-[#8B6DFF] disabled:opacity-50 px-3 py-2 rounded-lg text-xs font-medium transition">Post</button>
        </div>
      ) : (
        <p className="text-xs text-[#4B5563] mb-3">Sign in to comment</p>
      )}
      {comments.map(c => (
        <div key={c.id} className="flex gap-2 py-2.5 border-t border-[#1E1E2E]">
          <div className="w-6 h-6 rounded-full bg-[#7C5CFF]/20 flex items-center justify-center text-[10px] font-bold text-[#7C5CFF] shrink-0">{c.profiles?.display_name?.[0] || "?"}</div>
          <div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-medium">{c.profiles?.display_name || "User"}</span>
              <span className="text-[#4B5563]">@{c.profiles?.username}</span>
            </div>
            <p className="text-xs text-[#D1D5DB] mt-0.5">{c.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
