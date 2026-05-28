import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbi } from "viem";
import { defineChain } from "viem";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const monadTestnet = defineChain({
  id: 10143, name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
});

const client = createPublicClient({ chain: monadTestnet, transport: http() });
const ESCROW_ADDRESS = "0xca29b70a9Bb6D663a51218c58CEe725ec45fEDC3";

const ESCROW_ABI = parseAbi([
  "event TipReceived(address indexed tipper, string indexed xHandle, bytes32 indexed tweetId, uint256 amount)",
  "event Claimed(address indexed creator, string xHandle, uint256 amount)",
]);

export async function POST(req: NextRequest) {
  try {
    const { tweetId, txHash, fromUserId, toHandle, amount, isDirect, creatorAddress } = await req.json();

    if (!tweetId || !txHash || !fromUserId || !toHandle) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify on-chain
    const [tx, receipt] = await Promise.all([
      client.getTransaction({ hash: txHash }),
      client.getTransactionReceipt({ hash: txHash }),
    ]);

    if (receipt.status !== "success") {
      return NextResponse.json({ error: "Transaction failed" }, { status: 400 });
    }
    if (tx.chainId !== 10143) {
      return NextResponse.json({ error: "Wrong chain" }, { status: 400 });
    }

    // For direct tips, verify recipient
    if (isDirect && creatorAddress) {
      if (tx.to?.toLowerCase() !== creatorAddress.toLowerCase()) {
        return NextResponse.json({ error: "Wrong recipient" }, { status: 400 });
      }
    }

    // For escrow tips, verify contract call
    if (!isDirect) {
      if (tx.to?.toLowerCase() !== ESCROW_ADDRESS.toLowerCase()) {
        return NextResponse.json({ error: "Wrong contract" }, { status: 400 });
      }
    }

    // Save tip record
    const { error } = await supabase.from("tips").insert({
      tweet_id: tweetId,
      from_user_id: fromUserId,
      to_x_handle: toHandle,
      amount: amount.toString(),
      token: "MON",
      tx_hash: txHash,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Duplicate tx" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Activity ticker
    await supabase.from("activity_log").insert({
      event_type: "tip",
      tweet_id: tweetId,
      actor_handle: toHandle,
      metadata: { amount: (Number(amount) / 1e18).toFixed(4), token: "MON" },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
