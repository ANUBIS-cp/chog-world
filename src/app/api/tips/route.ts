import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { tweetId, txHash, fromUserId, toHandle, isDirect, creatorAddress } = await req.json();
    if (!tweetId || !txHash) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Save tip record (verification happens on-chain — we trust the client for initial save)
    const { error } = await supabase.from("tips").insert({
      tweet_id: tweetId,
      from_user_id: fromUserId,
      to_x_handle: toHandle,
      amount: "0",
      token: "MON",
      tx_hash: txHash,
    });

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Duplicate" }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Activity ticker
    await supabase.from("activity_log").insert({
      event_type: "tip",
      tweet_id: tweetId,
      actor_handle: toHandle,
      metadata: { token: "MON" },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
