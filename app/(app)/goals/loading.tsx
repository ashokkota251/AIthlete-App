import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 pb-2">
      <div>
        <Skeleton className="h-3 w-40 mb-2" />
        <Skeleton className="h-8 w-28" />
      </div>
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-[210px] rounded-card" />
      <Skeleton className="h-[210px] rounded-card" />
    </div>
  );
}
