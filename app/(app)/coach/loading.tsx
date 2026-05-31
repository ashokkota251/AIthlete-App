import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 24px - 110px)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="size-11 rounded-2xl" />
      </div>
      <Skeleton className="h-px w-full mb-4" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-20 w-3/4 rounded-2xl" />
        <Skeleton className="h-12 w-1/2 ml-auto rounded-2xl" />
      </div>
      <Skeleton className="h-12 w-full rounded-pill mt-4" />
    </div>
  );
}
