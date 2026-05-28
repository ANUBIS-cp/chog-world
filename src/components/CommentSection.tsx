"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Send } from "lucide-react";

export function CommentSection({ tweetId }: { tweetId: number }) {
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [user, setUser] = useState<any>(null);
  const [posting, setPosting] = useState(false);

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
    setPosting(true);
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweetId, userId: user.id, content: content.trim() }),
    });
    setContent("");
    setPosting(false);
    loadComments();
  }

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold text-text-tertiary uppercase mb-2">Comments ({comments.length})</h3>
      {user ? (
        <div className="flex gap-2 mb-3">
          <input value={content} onChange={e => setContent(e.target.value)} placeholder="Add a comment..." maxLength={500}
            className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent/50 transition"
            onKeyDown={e => e.key === "Enter" && postComment()} />
          <button onClick={postComment} disabled={posting || !content.trim()} className="bg-accent hover:bg-accent-hover disabled:opacity-50 px-3 py-2 rounded-lg text-xs font-medium text-white transition flex items-center gap-1.5">
            <Send size={13} />
          </button>
        </div>
      ) : (
        <p className="text-xs text-text-tertiary mb-3">Sign in to comment</p>
      )}
      {comments.map(c => (
        <div key={c.id} className="flex gap-2 py-2.5 border-t border-border">
          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
            {c.profiles?.display_name?.[0] || "?"}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-medium text-text-primary">{c.profiles?.display_name || "User"}</span>
              <span className="text-text-tertiary">@{c.profiles?.username}</span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">{c.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
