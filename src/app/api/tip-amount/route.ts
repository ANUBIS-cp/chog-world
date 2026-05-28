import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const AMOUNTS: Record<number, string> = { 1: "0.01", 2: "0.05", 3: "0.1" };

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`tip-amount:${ip}`, 30, 60000);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const tier = Number(req.nextUrl.searchParams.get("tier"));
  const schema = z.number().int().min(1).max(3);
  const parsed = schema.safeParse(tier);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const amountEth = AMOUNTS[tier];
  const amountWei = BigInt(Math.floor(parseFloat(amountEth) * 1e18)).toString();
  return NextResponse.json({ tier, amountEth, amountWei });
}
