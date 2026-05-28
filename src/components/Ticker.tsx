"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Activity {
  id: number;
  event_type: string;
  actor_name: string;
  actor_handle: string;
  metadata: any;
  created_at: string;
}

export function Ticker() {
  const [items, setItems] = useState<Activity[]>([]);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchActivity() {
    const { data } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setItems(data);
  }

  if (!items.length) return null;

  const text = items
    .map((a) => {
      if (a.event_type === "tip") {
        return `💸 ${a.actor_name || a.actor_handle} just tipped ${a.metadata?.amount} ${a.metadata?.token} to @${a.metadata?.to_handle}`;
      }
      if (a.event_type === "highlight") {
        return `⭐ @${a.actor_handle} tweet highlighted!`;
      }
      return "";
    })
    .filter(Boolean)
    .join("  •  ");

  return (
    <div className="bg-purple-900/30 border-b border-purple-800/30 overflow-hidden h-7 flex items-center">
      <div className="animate-marquee whitespace-nowrap text-xs text-purple-300">
        {text}
      </div>
    </div>
  );
}
