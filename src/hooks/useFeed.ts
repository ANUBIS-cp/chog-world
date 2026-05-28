"use client";
import { useInfiniteQuery } from "@tanstack/react-query";

interface FeedParams {
  sort: string;
  search?: string;
}

async function fetchFeed({ pageParam = 0, queryKey }: { pageParam?: number; queryKey: any[] }) {
  const [_key, params] = queryKey as [string, FeedParams];
  const searchParams = new URLSearchParams();
  searchParams.set("sort", params.sort);
  searchParams.set("offset", String(pageParam));
  searchParams.set("limit", "10");
  if (params.search) searchParams.set("search", params.search);

  const res = await fetch(`/api/feed?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch feed");
  return res.json();
}

export function useFeed(params: FeedParams) {
  return useInfiniteQuery({
    queryKey: ["feed", params],
    queryFn: fetchFeed,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    initialPageParam: 0,
    staleTime: 30000,
  });
}
