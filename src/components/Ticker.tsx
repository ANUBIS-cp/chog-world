"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/api";

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
    let cancelled = false;
    async function fetchActivity() {
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (!cancelled && data) setItems(data);
    }
    fetchActivity();
    const interval = setInterval(fetchActivity, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (!items.length) return null;

  const text = items
    .map((a) => {
      if (a.event_type === "tip") {
        return `💸 ${a.actor_name || a.actor_handle} tipped ${a.metadata?.amount || ""} ${a.metadata?.token || "MON"} to @${a.metadata?.to_handle || a.actor_handle}`;
      }
      if (a.event_type === "highlight") {
        return `⭐ @${a.actor_handle} tweet highlighted!`;
      }
      return "";
    })
    .filter(Boolean)
    .join("  •  ");

  return (
    <div className="bg-[#7C5CFF]/10 border-b border-[#7C5CFF]/20 overflow-hidden h-7 flex items-center">
      <div className="animate-marquee whitespace-nowrap text-xs text-[#7C5CFF] font-medium px-4">
        {text}
      </div>
    </div>
  );
}
