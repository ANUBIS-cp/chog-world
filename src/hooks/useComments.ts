"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/api";

async function fetchComments(tweetId: number) {
  const { data } = await supabase
    .from("comments")
    .select("*, profiles(display_name, username, pfp_url)")
    .eq("tweet_id", tweetId)
    .order("created_at", { ascending: true });
  return data || [];
}

export function useComments(tweetId: number) {
  return useQuery({
    queryKey: ["comments", tweetId],
    queryFn: () => fetchComments(tweetId),
    staleTime: 10000,
  });
}

export function usePostComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tweetId, content, parentId }: { tweetId: number; content: string; parentId?: number }) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tweetId, content, parentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to post");
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["comments", vars.tweetId] });
    },
  });
}
