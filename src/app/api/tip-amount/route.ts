import { NextRequest, NextResponse } from "next/server";

const AMOUNTS: Record<number, string> = { 1: "0.01", 2: "0.05", 3: "0.1" };

export async function GET(req: NextRequest) {
  const tier = Number(req.nextUrl.searchParams.get("tier"));
  const amountEth = AMOUNTS[tier];
  if (!amountEth) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  const amountWei = BigInt(Math.floor(parseFloat(amountEth) * 1e18)).toString();
  return NextResponse.json({ tier, amountEth, amountWei });
}
