"use client";
import { useState } from "react";
import { useComments, usePostComment } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { Send, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function CommentSection({ tweetId }: { tweetId: number }) {
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useComments(tweetId);
  const postComment = usePostComment();

  const topLevel = comments.filter((c: any) => !c.parent_id);
  const getReplies = (parentId: number) => comments.filter((c: any) => c.parent_id === parentId);

  function handleSubmit() {
    if (!content.trim() || !user) return;
    postComment.mutate({ tweetId, content: content.trim(), parentId: replyTo || undefined });
    setContent("");
    setReplyTo(null);
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-[#6B7280] mb-3 flex items-center gap-2">
        <MessageCircle size={15} />
        {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
      </h3>

      {user ? (
        <div className="flex gap-2 mb-4">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? "Reply..." : "Add a comment..."}
            maxLength={500}
            className="flex-1 bg-[#1A1A24] border border-[#252534] rounded-xl px-4 py-2.5 text-sm text-[#F0F0F5] placeholder-[#4B5563] focus:outline-none focus:border-[#7C5CFF]/50 transition-colors"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={postComment.isPending || !content.trim()}
            className="bg-[#7C5CFF] hover:bg-[#8B6DFF] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Send size={14} />
          </motion.button>
          {replyTo && (
            <button onClick={() => setReplyTo(null)} className="text-xs text-[#6B7280] hover:text-[#F0F0F5] px-2">
              Cancel
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#4B5563] mb-4 bg-[#1A1A24] border border-[#252534] rounded-xl px-4 py-3">
          Sign in to comment
        </p>
      )}

      <AnimatePresence>
        {topLevel.map((c: any) => (
          <CommentItem key={c.id} comment={c} replies={getReplies(c.id)} onReply={() => setReplyTo(c.id)} />
        ))}
      </AnimatePresence>

      {isLoading && (
        <div className="space-y-3 mt-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-3 py-3 border-t border-[#1E1E2E]">
              <div className="w-7 h-7 rounded-full bg-[#1A1A24] animate-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="w-20 h-2.5 rounded bg-[#1A1A24] animate-shimmer" />
                <div className="w-full h-2.5 rounded bg-[#1A1A24] animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, replies, onReply }: { comment: any; replies: any[]; onReply: () => void }) {
  const [showReplies, setShowReplies] = useState(true);

  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "now";
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-3 border-t border-[#1E1E2E]">
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-[#7C5CFF]/15 flex items-center justify-center text-[10px] font-bold text-[#7C5CFF] shrink-0">
          {comment.profiles?.display_name?.[0] || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[#F0F0F5]">{comment.profiles?.display_name || "User"}</span>
            <span className="text-xs text-[#4B5563]">@{comment.profiles?.username || "user"}</span>
            <span className="text-xs text-[#3A3A50]">·</span>
            <span className="text-xs text-[#4B5563]">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-[#D1D5DB] mt-1">{comment.content}</p>
          <button onClick={onReply} className="text-xs text-[#4B5563] hover:text-[#7C5CFF] mt-1.5 transition-colors">
            Reply
          </button>

          {replies.length > 0 && (
            <button onClick={() => setShowReplies(!showReplies)} className="text-xs text-[#4B5563] hover:text-[#6B7280] mt-1 ml-3 transition-colors">
              {showReplies ? "Hide" : "Show"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          )}

          {showReplies && replies.map((r: any) => (
            <div key={r.id} className="mt-2 ml-2 pl-3 border-l-2 border-[#1E1E2E]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-[#F0F0F5]">{r.profiles?.display_name || "User"}</span>
                <span className="text-xs text-[#4B5563]">@{r.profiles?.username || "user"}</span>
                <span className="text-xs text-[#3A3A50]">·</span>
                <span className="text-xs text-[#4B5563]">{timeAgo(r.created_at)}</span>
              </div>
              <p className="text-sm text-[#D1D5DB] mt-0.5">{r.content}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
