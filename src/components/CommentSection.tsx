"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Send, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: number;
  tweet_id: number;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: number | null;
  profiles?: { display_name: string; username: string; pfp_url: string };
}

export function CommentSection({ tweetId }: { tweetId: number }) {
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", tweetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(display_name, username, pfp_url)")
        .eq("tweet_id", tweetId)
        .order("created_at", { ascending: true });
      return data || [];
    },
    staleTime: 10000,
  });

  const postComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId: number | null }) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tweetId, content, parentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to post comment");
      }
    },
    onSuccess: () => {
      setContent("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ["comments", tweetId] });
      toast.success("Comment posted!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const topLevel = comments.filter((c: Comment) => !c.parent_id);
  const replies = comments.filter((c: Comment) => c.parent_id);

  function handleSubmit() {
    if (!content.trim() || !user) return;
    postComment.mutate({ content: content.trim(), parentId: replyTo });
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-[#9CA3AF] mb-3 flex items-center gap-2">
        <MessageCircle size={16} />
        Comments
      </h3>

      {user ? (
        <div className="flex gap-2 mb-4">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
            maxLength={500}
            className="flex-1 bg-[#1A1A24] border border-[#252534] rounded-xl px-4 py-2.5 text-sm text-[#F0F0F5] placeholder-[#6B7280] focus:outline-none focus:border-[#7C5CFF] transition-colors"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={postComment.isPending || !content.trim()}
            className="bg-[#7C5CFF] hover:bg-[#9A7FFF] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Send size={14} />
            {replyTo ? "Reply" : "Post"}
          </motion.button>
          {replyTo && (
            <button
              onClick={() => setReplyTo(null)}
              className="text-sm text-[#6B7280] hover:text-[#F0F0F5] px-2"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-[#6B7280] mb-4 bg-[#1A1A24] border border-[#252534] rounded-xl px-4 py-3">
          Sign in to comment.
        </p>
      )}

      <AnimatePresence>
        {topLevel.map((c: Comment) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="py-3 border-t border-[#252534]"
          >
            <CommentItem
              comment={c}
              replies={replies.filter((r: Comment) => r.parent_id === c.id)}
              onReply={() => setReplyTo(c.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {isLoading && (
        <div className="space-y-3 mt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 py-3 border-t border-[#252534]">
              <div className="w-7 h-7 rounded-full bg-[#1A1A24] animate-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="w-24 h-3 rounded bg-[#1A1A24] animate-shimmer" />
                <div className="w-full h-3 rounded bg-[#1A1A24] animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, replies, onReply }: { comment: Comment; replies: Comment[]; onReply: () => void }) {
  const [showReplies, setShowReplies] = useState(true);

  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "now";
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  return (
    <div>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-[#7C5CFF]/20 flex items-center justify-center text-xs font-bold text-[#7C5CFF] shrink-0">
          {comment.profiles?.display_name?.[0] || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#F0F0F5]">{comment.profiles?.display_name || "User"}</span>
            <span className="text-xs text-[#6B7280]">@{comment.profiles?.username || "user"}</span>
            <span className="text-xs text-[#4B5563]">·</span>
            <span className="text-xs text-[#6B7280]">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-[#E4E4E7] mt-1">{comment.content}</p>
          <button
            onClick={onReply}
            className="text-xs text-[#6B7280] hover:text-[#7C5CFF] mt-1.5 transition-colors"
          >
            Reply
          </button>

          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-[#6B7280] hover:text-[#9CA3AF] mt-1 ml-4 transition-colors"
            >
              {showReplies ? "Hide" : "Show"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          )}

          {showReplies && replies.map((r: Comment) => (
            <div key={r.id} className="mt-2 ml-4 pl-4 border-l-2 border-[#252534]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[#F0F0F5]">{r.profiles?.display_name || "User"}</span>
                <span className="text-xs text-[#6B7280]">@{r.profiles?.username || "user"}</span>
                <span className="text-xs text-[#4B5563]">·</span>
                <span className="text-xs text-[#6B7280]">{timeAgo(r.created_at)}</span>
              </div>
              <p className="text-sm text-[#E4E4E7] mt-1">{r.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
