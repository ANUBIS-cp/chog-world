import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get("sort") || "hot";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 100);

  let query = supabase.from("tweets").select("*");

  if (sort === "new") {
    query = query.order("posted_at", { ascending: false });
  } else {
    query = query.order("likes_count", { ascending: false,  });
  }

  const { data, error } = await query.limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
