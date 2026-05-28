import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/api";

export async function POST(req: NextRequest) {
  const { tweetId, userId, content, parentId } = await req.json();
  if (!tweetId || !userId || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (content.length > 500) return NextResponse.json({ error: "Too long" }, { status: 400 });
  const supabase = getServiceClient();
  const { error } = await supabase.from("comments").insert({ tweet_id: tweetId, user_id: userId, content, parent_id: parentId || null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
