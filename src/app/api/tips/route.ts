import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { tweetId, txHash, fromUserId, toHandle, amountWei } = await req.json();
    if (!tweetId || !txHash) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const supabase = getServiceClient();
    const { error } = await supabase.from("tips").insert({
      tweet_id: tweetId, from_user_id: fromUserId, to_x_handle: toHandle,
      amount: amountWei || "0", token: "MON", tx_hash: txHash, verified: false,
    });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Duplicate" }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await supabase.from("activity_log").insert({ event_type: "tip", tweet_id: tweetId, actor_handle: toHandle, metadata: { token: "MON", amount: amountWei } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
