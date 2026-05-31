import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5 pb-2">
      <div>
        <Skeleton className="h-3 w-40 mb-2" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-[160px] rounded-card" />
      <Skeleton className="h-[180px] rounded-card" />
      <Skeleton className="h-[130px] rounded-card" />
      <Skeleton className="h-[160px] rounded-card" />
    </div>
  );
}
