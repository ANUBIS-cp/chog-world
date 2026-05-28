"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TweetCard } from "@/components/TweetCard";
import { CommentSection } from "@/components/CommentSection";

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
        // Look up creator profile by X handle
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

  if (loading) return <div className="py-20 text-center text-zinc-600">Loading...</div>;
  if (!tweet) return <div className="py-20 text-center text-zinc-600">Tweet not found.</div>;

  return (
    <div className="py-6">
      <TweetCard tweet={tweet} />
      
      <CommentSection tweetId={tweet.id} />
    </div>
  );
}
