import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { tweetId, userId, content, parentId } = await req.json();

  if (!tweetId || !userId || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "Comment too long" }, { status: 400 });
  }

  const { error } = await supabase.from("comments").insert({
    tweet_id: tweetId,
    user_id: userId,
    content,
    parent_id: parentId || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
