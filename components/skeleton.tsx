import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
  /** ARIA label override; defaults to "Loading" */
  label?: string;
}

export function Skeleton({ className, label }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label ?? "Loading"}
      aria-busy="true"
      className={cn("skeleton rounded-md", className)}
    />
  );
}
