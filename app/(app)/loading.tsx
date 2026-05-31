import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-3.5 pb-4">
      <div className="flex items-center justify-between mt-1 mb-1">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-36" />
        </div>
        <Skeleton className="size-[46px] rounded-full" />
      </div>
      <Skeleton className="h-[164px] rounded-card" />
      <Skeleton className="h-[120px] rounded-card" />
      <Skeleton className="h-[180px] rounded-card" />
      <Skeleton className="h-[140px] rounded-card" />
      <div className="grid grid-cols-2 gap-3.5">
        <Skeleton className="h-[110px] rounded-card" />
        <Skeleton className="h-[110px] rounded-card" />
      </div>
    </div>
  );
}
