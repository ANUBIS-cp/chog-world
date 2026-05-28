import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sort = searchParams.get("sort") || "hot";
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit")) || 10));
  const search = searchParams.get("q")?.trim();

  const supabase = getServiceClient();
  let query = supabase.from("tweets").select("*", { count: "exact" });
  if (search) query = query.or(`content.ilike.%${search}%,x_author_handle.ilike.%${search}%`);
  if (sort === "new") query = query.order("posted_at", { ascending: false });
  else if (sort === "top") query = query.order("likes_count", { ascending: false });
  else query = query.gte("posted_at", new Date(Date.now() - 86400000 * 7).toISOString()).order("likes_count", { ascending: false });
  query = query.range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const nextOffset = (data?.length === limit && count && offset + limit < count) ? offset + limit : null;
  return NextResponse.json({ tweets: data || [], nextOffset, total: count || 0 });
}
