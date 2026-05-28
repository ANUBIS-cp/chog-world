"use client";

export function TweetCardSkeleton() {
  return (
    <div className="card flex overflow-hidden">
      <div className="flex flex-col items-center py-3 px-2 border-r border-[#252534] min-w-[48px]">
        <div className="w-6 h-6 rounded bg-[#1A1A24] animate-shimmer" />
        <div className="w-6 h-4 rounded bg-[#1A1A24] animate-shimmer my-1" />
        <div className="w-6 h-6 rounded bg-[#1A1A24] animate-shimmer" />
      </div>
      <div className="flex-1 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1A1A24] animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-32 h-4 rounded bg-[#1A1A24] animate-shimmer" />
            <div className="w-48 h-3 rounded bg-[#1A1A24] animate-shimmer" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="w-full h-4 rounded bg-[#1A1A24] animate-shimmer" />
          <div className="w-3/4 h-4 rounded bg-[#1A1A24] animate-shimmer" />
        </div>
        <div className="mt-3 flex gap-3">
          <div className="w-16 h-8 rounded-lg bg-[#1A1A24] animate-shimmer" />
          <div className="w-16 h-8 rounded-lg bg-[#1A1A24] animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
