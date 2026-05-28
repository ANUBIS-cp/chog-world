"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function Ticker() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(10);
      if (data) setItems(data);
    }
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  if (!items.length) return null;
  const text = items.map(a => {
    if (a.event_type === "tip") return `💸 ${a.actor_handle} tipped ${a.metadata?.amount || ""} ${a.metadata?.token || "MON"}`;
    if (a.event_type === "highlight") return `⭐ @${a.actor_handle} highlighted`;
    return "";
  }).filter(Boolean).join("  •  ");

  return (
    <div className="bg-[#7C5CFF]/10 border-b border-[#7C5CFF]/20 overflow-hidden h-6 flex items-center">
      <div className="animate-marquee text-[11px] text-[#7C5CFF] font-medium px-4">{text}</div>
    </div>
  );
}
