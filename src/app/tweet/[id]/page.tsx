"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TweetCard } from "@/components/TweetCard";
import { CommentSection } from "@/components/CommentSection";
import { Nav } from "@/components/Nav";
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
      <Nav />
      <main className="max-w-2xl mx-auto px-4 pb-20 pt-4">
        <Link href="/" className="text-xs text-[#4B5563] hover:text-[#F0F0F5] mb-3 inline-block">← Back</Link>
        {loading ? <div className="text-center py-20 text-[#4B5563]">Loading...</div> :
         !tweet ? <div className="text-center py-20 text-[#4B5563]">Not found</div> :
         <div>
           <TweetCard tweet={tweet} creatorWallet={creatorWallet} />
           <CommentSection tweetId={tweet.id} />
         </div>}
      </main>
    </div>
  );
}
