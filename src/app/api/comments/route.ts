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
  content: z.string().min(1).max(500).trim(),
  parentId: z.number().int().positive().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`comment:${ip}`, 10, 60000);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limited. Try again later." }, { status: 429 });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tweetId, content, parentId } = parsed.data;

  const { error } = await supabase.from("comments").insert({
    tweet_id: tweetId,
    user_id: user.id,
    content,
    parent_id: parentId || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
