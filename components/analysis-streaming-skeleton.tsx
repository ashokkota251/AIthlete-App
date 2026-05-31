import { Skeleton } from "@/components/skeleton";

export function AnalysisStreamingSkeleton() {
  return (
    <div className="space-y-4 pb-2 mt-5">
      {/* Summary coral hero */}
      <Skeleton className="h-[164px] rounded-card" />
      {/* Highlights */}
      <Skeleton className="h-[180px] rounded-card" />
      {/* Improvements */}
      <Skeleton className="h-[140px] rounded-card" />
      {/* Suggestions × 3 */}
      <Skeleton className="h-[68px] rounded-card" />
      <Skeleton className="h-[68px] rounded-card" />
      <Skeleton className="h-[68px] rounded-card" />
      {/* Coach-loading caption */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-muted pt-2 pb-1">
        <span className="size-1.5 rounded-full bg-coral animate-pulseDot" />
        <span className="size-1.5 rounded-full bg-coral animate-pulseDot" style={{ animationDelay: "150ms" }} />
        <span className="size-1.5 rounded-full bg-coral animate-pulseDot" style={{ animationDelay: "300ms" }} />
        <span className="ml-1">The coach is reading your week…</span>
      </div>
    </div>
  );
}
