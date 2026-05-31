import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-3.5 pb-2">
      <Skeleton className="h-7 w-24 rounded-md" />

      {/* Route header */}
      <Skeleton className="h-[120px] rounded-card" />
      {/* Verdict banner */}
      <Skeleton className="h-[58px] rounded-[14px]" />

      {/* Hero stats 4-up */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-[16px]" />
        ))}
      </div>

      {/* Went well / to watch / next action / ask coach */}
      <Skeleton className="h-[150px] rounded-card" />
      <Skeleton className="h-[120px] rounded-card" />
      <Skeleton className="h-[120px] rounded-card" />
      <Skeleton className="h-12 rounded-[16px]" />

      {/* "The detail" divider */}
      <div className="pt-3 flex items-center gap-3">
        <Skeleton className="h-px flex-1" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-px flex-1" />
      </div>

      {/* Metric grid 3×3 */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-[78px] rounded-[16px]" />
        ))}
      </div>

      {/* HR / Power / Splits / Recovery / Next ride */}
      <Skeleton className="h-[260px] rounded-card mt-3" />
      <Skeleton className="h-[120px] rounded-card" />
      <Skeleton className="h-[200px] rounded-card" />
      <Skeleton className="h-[200px] rounded-card mt-6" />
      <Skeleton className="h-[180px] rounded-card" />
    </div>
  );
}
