import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-end justify-between gap-2">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-pill" />
            <Skeleton className="size-9 rounded-pill" />
          </div>
        </div>
        <Skeleton className="h-px w-full mt-4" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[120px] rounded-card" />
      ))}
    </div>
  );
}
