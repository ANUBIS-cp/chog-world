"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PostCard } from "@/components/PostCard";
import { CommentSection } from "@/components/CommentSection";
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
        const { data: p } = await supabase.from("profiles").select("wallet_address").ilike("x_handle", t.x_author_handle).single();
        setCreatorWallet(p?.wallet_address || null);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  return (
    <div>
      <Link href="/" className="text-xs text-text-tertiary hover:text-text-primary mb-3 inline-block transition">
        &larr; Back
      </Link>
      {loading ? <div className="text-center text-text-tertiary py-20">Loading...</div> :
       !tweet ? <div className="text-center text-text-tertiary py-20">Not found</div> :
       <div>
         <PostCard tweet={tweet} creatorWallet={creatorWallet} />
         <CommentSection tweetId={tweet.id} />
       </div>}
    </div>
  );
}
