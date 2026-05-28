"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/api";

async function fetchVotes(tweetId: number) {
  const [{ count: ups }, { count: downs }] = await Promise.all([
    supabase.from("tweet_votes").select("*", { count: "exact", head: true }).eq("tweet_id", tweetId).eq("vote_type", 1),
    supabase.from("tweet_votes").select("*", { count: "exact", head: true }).eq("tweet_id", tweetId).eq("vote_type", -1),
  ]);
  const { data: u } = await supabase.auth.getUser();
  let myVote = 0;
  if (u.user) {
    const { data: v } = await supabase.from("tweet_votes").select("vote_type").eq("tweet_id", tweetId).eq("user_id", u.user.id).single();
    myVote = v?.vote_type || 0;
  }
  return { score: (ups || 0) - (downs || 0), myVote };
}

export function useVotes(tweetId: number) {
  return useQuery({
    queryKey: ["votes", tweetId],
    queryFn: () => fetchVotes(tweetId),
    staleTime: 10000,
  });
}

export function useVoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tweetId, type }: { tweetId: number; type: number }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sign in to vote");

      const { data: existing } = await supabase
        .from("tweet_votes")
        .select("vote_type")
        .eq("tweet_id", tweetId)
        .eq("user_id", u.user.id)
        .single();

      if (existing && existing.vote_type === type) {
        await supabase.from("tweet_votes").delete().eq("tweet_id", tweetId).eq("user_id", u.user.id);
        return { tweetId, newVote: 0 };
      } else {
        await supabase.from("tweet_votes").upsert(
          { tweet_id: tweetId, user_id: u.user.id, vote_type: type },
          { onConflict: "tweet_id,user_id" }
        );
        return { tweetId, newVote: type };
      }
    },
    onMutate: async ({ tweetId, type }) => {
      await queryClient.cancelQueries({ queryKey: ["votes", tweetId] });
      const previous = queryClient.getQueryData(["votes", tweetId]);
      
      queryClient.setQueryData(["votes", tweetId], (old: any) => {
        if (!old) return old;
        const prevVote = old.myVote;
        const newVote = prevVote === type ? 0 : type;
        return { ...old, score: old.score + (newVote - prevVote), myVote: newVote };
      });

      return { previous };
    },
    onError: (err, vars, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["votes", vars.tweetId], context.previous);
      }
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: ["votes", vars.tweetId] });
    },
  });
}
