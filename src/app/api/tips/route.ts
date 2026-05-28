import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getAuthUser } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const schema = z.object({
  tweetId: z.number().int().positive(),
  txHash: z.string().min(10).max(100),
  fromUserId: z.string().max(100).optional(),
  toHandle: z.string().max(50).optional(),
  amountWei: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`tip:${ip}`, 5, 60000);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limited. Try again later." }, { status: 429 });
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tweetId, txHash, toHandle, amountWei } = parsed.data;
  const user = await getAuthUser(req);
  const fromUserId = user?.id || parsed.data.fromUserId || "anon";

  let txVerified = false;
  try {
    const rpcRes = await fetch("https://testnet-rpc.monad.xyz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [txHash],
      }),
    });
    const rpcData = await rpcRes.json();
    if (rpcData.result && rpcData.result.status === "0x1") {
      txVerified = true;
    }
  } catch {
    // RPC failed
  }

  const { error } = await supabase.from("tips").insert({
    tweet_id: tweetId,
    from_user_id: fromUserId,
    to_x_handle: toHandle || null,
    amount: amountWei || "0",
    token: "MON",
    tx_hash: txHash,
    verified: txVerified,
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Duplicate tip" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    event_type: "tip",
    tweet_id: tweetId,
    actor_handle: toHandle || "unknown",
    metadata: { token: "MON", amount: amountWei, verified: txVerified },
  });

  return NextResponse.json({ success: true, verified: txVerified });
}
