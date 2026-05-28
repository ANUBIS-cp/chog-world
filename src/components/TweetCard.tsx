"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, ExternalLink, ArrowBigUp, ArrowBigDown, Zap } from "lucide-react";
import { useVotes, useVoteMutation } from "@/hooks/useVotes";
import { useTipModal } from "@/hooks/useTipModal";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/lib/wallet";
import { toast } from "sonner";

export function TweetCard({ tweet, creatorWallet, index = 0 }: any) {
  const { user } = useAuth();
  const { address } = useWallet();
  const { open: openTip } = useTipModal();
  const { data: voteData, isLoading: votesLoading } = useVotes(tweet.id);
  const voteMutation = useVoteMutation();

  const score = voteData?.score ?? 0;
  const myVote = voteData?.myVote ?? 0;

  const media = (() => {
    const raw = tweet.media_urls;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return [...new Set(JSON.parse(raw))]; } catch { return []; }
  })();

  const timeAgo = (() => {
    const s = Math.floor((Date.now() - new Date(tweet.posted_at).getTime()) / 1000);
    if (s < 60) return "now";
    if (s < 3600) return Math.floor(s / 60) + "m";
    if (s < 86400) return Math.floor(s / 3600) + "h";
    return Math.floor(s / 86400) + "d";
  })();

  function handleVote(type: number) {
    if (!user) {
      toast.error("Sign in to vote");
      return;
    }
    voteMutation.mutate({ tweetId: tweet.id, type });
  }

  function handleTip() {
    if (!address) {
      toast.info("Connect your wallet first");
      return;
    }
    openTip(tweet, creatorWallet || null);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-[#13131A] border border-[#1E1E2E] rounded-2xl overflow-hidden hover:border-[#2A2A40] transition-colors duration-200"
    >
      <div className="flex">
        {/* Vote Rail */}
        <div className="flex flex-col items-center py-3 px-2 border-r border-[#1E1E2E] min-w-[52px]">
          <motion.button
            whileTap={{ scale: 1.25 }}
            onClick={() => handleVote(1)}
            disabled={voteMutation.isPending}
            className={`p-1 rounded-lg transition-colors ${
              myVote === 1 ? "text-[#7C5CFF]" : "text-[#4B5563] hover:text-[#7C5CFF]"
            }`}
          >
            <ArrowBigUp size={22} fill={myVote === 1 ? "#7C5CFF" : "none"} />
          </motion.button>

          <span className={`text-[13px] font-mono font-bold my-0.5 tabular-nums ${
            myVote === 1 ? "text-[#7C5CFF]" : myVote === -1 ? "text-[#EF4444]" : "text-[#9CA3AF]"
          }`}>
            {score}
          </span>

          <motion.button
            whileTap={{ scale: 1.25 }}
            onClick={() => handleVote(-1)}
            disabled={voteMutation.isPending}
            className={`p-1 rounded-lg transition-colors ${
              myVote === -1 ? "text-[#EF4444]" : "text-[#4B5563] hover:text-[#EF4444]"
            }`}
          >
            <ArrowBigDown size={22} fill={myVote === -1 ? "#EF4444" : "none"} />
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-4">
          {/* Author */}
          <div className="flex items-center gap-2.5 mb-2">
            {tweet.x_author_pfp ? (
              <img
                src={tweet.x_author_pfp}
                alt=""
                className="w-8 h-8 rounded-full border border-[#252534] shrink-0 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#7C5CFF]/20 flex items-center justify-center text-xs font-bold text-[#7C5CFF] shrink-0">
                {tweet.x_author_name?.[0] || "?"}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[#F0F0F5] truncate">
                  {tweet.x_author_name}
                </span>
                <span className="text-xs text-[#6B7280]">@{tweet.x_author_handle}</span>
                <span className="text-xs text-[#3A3A50]">·</span>
                <span className="text-xs text-[#6B7280]">{timeAgo}</span>
              </div>
            </div>
          </div>

          {/* Text */}
          <Link href={`/tweet/${tweet.id}`} className="block">
            <p className="text-[15px] leading-[1.6] text-[#D1D5DB] whitespace-pre-wrap break-words">
              {tweet.content}
            </p>
          </Link>

          {/* Media */}
          {media.length > 0 && (
            <div className={`mt-3 grid gap-2 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {media.slice(0, 4).map((url: string, i: number) => (
                <div key={i} className="relative overflow-hidden rounded-xl border border-[#252534] bg-[#0B0B0F]">
                  <img
                    src={url}
                    alt=""
                    className="w-full h-auto max-h-[320px] object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-1">
            <Link
              href={`/tweet/${tweet.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6B7280] hover:text-[#9CA3AF] hover:bg-[#1A1A24] transition-colors"
            >
              <MessageSquare size={14} />
              <span>{tweet.comments_count || 0}</span>
            </Link>

            <button
              onClick={handleTip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#7C5CFF] hover:bg-[#7C5CFF]/10 transition-colors"
            >
              <Zap size={14} />
              <span>Tip</span>
            </button>

            <a
              href={tweet.x_url}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#6B7280] hover:text-[#9CA3AF] hover:bg-[#1A1A24] transition-colors ml-auto"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
