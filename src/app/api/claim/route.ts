import { NextRequest, NextResponse } from "next/server";
import { encodePacked, keccak256, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const SIGNER_KEY = process.env.SIGNER_PRIVATE_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { creatorAddress, xHandle } = await req.json();
    if (!creatorAddress || !xHandle) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!SIGNER_KEY) {
      return NextResponse.json({ error: "Signer not configured" }, { status: 500 });
    }

    const account = privateKeyToAccount(SIGNER_KEY as `0x${string}`);
    const normalized = getAddress(creatorAddress);

    // Match contract: keccak256(abi.encodePacked(msg.sender, xHandle))
    const messageHash = keccak256(
      encodePacked(["address", "string"], [normalized, xHandle])
    );

    // Ethereum signed message prefix
    const signature = await account.signMessage({
      message: { raw: messageHash },
    });

    return NextResponse.json({ signature, creatorAddress: normalized, xHandle });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
