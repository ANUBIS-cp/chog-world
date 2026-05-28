import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sort = searchParams.get("sort") || "hot";
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
  const cursor = searchParams.get("cursor");
  const search = searchParams.get("search")?.trim();

  let query = supabase.from("tweets").select("*");

  if (search) {
    query = query.or(`content.ilike.%${search}%,x_author_handle.ilike.%${search}%`);
  }

  if (sort === "new") {
    query = query.order("posted_at", { ascending: false });
  } else if (sort === "top") {
    query = query.order("likes_count", { ascending: false });
  } else {
    query = query.gte("posted_at", new Date(Date.now() - 86400000 * 7).toISOString());
    query = query.order("likes_count", { ascending: false });
  }

  if (cursor) {
    const cursorId = Number(cursor);
    if (!isNaN(cursorId)) {
      if (sort === "new") {
        query = query.lt("id", cursorId);
      } else {
        query = query.lt("likes_count", cursorId);
      }
    }
  }

  const { data, error } = await query.limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const nextCursor = data && data.length === limit ? String(data[data.length - 1].id) : null;

  return NextResponse.json({ tweets: data || [], nextCursor });
}
