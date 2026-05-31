import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5 pb-2">
      <div className="flex flex-col items-center text-center pt-2 pb-1 space-y-3">
        <Skeleton className="size-[88px] rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-[120px] rounded-card" />
      <Skeleton className="h-[60px] rounded-card" />
      <Skeleton className="h-[60px] rounded-card" />
      <Skeleton className="h-[60px] rounded-card" />
      <Skeleton className="h-[60px] rounded-card" />
    </div>
  );
}
