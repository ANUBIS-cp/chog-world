"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/api";
import { TweetCard } from "@/components/TweetCard";
import { TweetCardSkeleton } from "@/components/TweetCardSkeleton";
import { CommentSection } from "@/components/CommentSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TweetPage() {
  const { id } = useParams<{ id: string }>();
  const [tweet, setTweet] = useState<any>(null);
  const [creatorWallet, setCreatorWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from("tweets").select("*").eq("id", Number(id)).single();
      setTweet(t);
      if (t) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("wallet_address")
          .ilike("x_handle", t.x_author_handle)
          .single();
        setCreatorWallet(profile?.wallet_address || null);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="py-4">
      <TweetCardSkeleton />
    </div>
  );

  if (!tweet) return (
    <div className="py-20 text-center text-[#6B7280]">
      <p className="text-lg">Tweet not found</p>
      <Link href="/" className="text-[#7C5CFF] hover:underline mt-2 inline-block text-sm">
        ← Back to feed
      </Link>
    </div>
  );

  return (
    <div className="py-4">
      <Link href="/" className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#F0F0F5] mb-4 transition-colors">
        <ArrowLeft size={14} />
        Back
      </Link>
      <TweetCard tweet={tweet} creatorWallet={creatorWallet} />
      <ErrorBoundary>
        <CommentSection tweetId={tweet.id} />
      </ErrorBoundary>
    </div>
  );
}
