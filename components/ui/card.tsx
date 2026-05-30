import { cn } from "@/lib/cn";
import type { ComponentPropsWithoutRef } from "react";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("card", className)} {...props} />;
}

export function CardCoral({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("card-coral", className)} {...props} />;
}

export function CardSection({
  label,
  trailing,
  children,
  className,
}: {
  label?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      {(label || trailing) && (
        <header className="flex items-end justify-between">
          {label && <span className="eyebrow">{label}</span>}
          {trailing}
        </header>
      )}
      {children}
    </section>
  );
}
