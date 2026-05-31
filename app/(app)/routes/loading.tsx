import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5 pb-2">
      <div className="space-y-2">
        <Skeleton className="size-9 rounded-pill" />
        <Skeleton className="h-3 w-44 mt-2" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-px w-full" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[108px] rounded-card" />
      ))}
    </div>
  );
}
