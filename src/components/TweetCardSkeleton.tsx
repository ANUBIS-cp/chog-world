"use client";

export function TweetCardSkeleton() {
  return (
    <div className="bg-[#13131A] border border-[#1E1E2E] rounded-2xl overflow-hidden flex">
      <div className="flex flex-col items-center py-3 px-2 border-r border-[#1E1E2E] min-w-[52px]">
        <div className="w-5 h-5 rounded bg-[#1A1A24] animate-shimmer" />
        <div className="w-4 h-3 rounded bg-[#1A1A24] animate-shimmer my-1.5" />
        <div className="w-5 h-5 rounded bg-[#1A1A24] animate-shimmer" />
      </div>
      <div className="flex-1 p-4">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#1A1A24] animate-shimmer shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="w-28 h-3.5 rounded bg-[#1A1A24] animate-shimmer" />
            <div className="w-20 h-2.5 rounded bg-[#1A1A24] animate-shimmer" />
          </div>
        </div>
        <div className="space-y-2 mt-3">
          <div className="w-full h-3.5 rounded bg-[#1A1A24] animate-shimmer" />
          <div className="w-3/4 h-3.5 rounded bg-[#1A1A24] animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
