import { cn } from "@/lib/cn";

interface StatProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  trend?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function Stat({ label, value, unit, trend, align = "left", className }: StatProps) {
  return (
    <div className={cn("space-y-1.5", align === "right" && "text-right", className)}>
      <div className="eyebrow">{label}</div>
      <div className="flex items-baseline gap-1.5 nums font-display-wide text-3xl text-ink-900">
        <span>{value}</span>
        {unit && <span className="text-sm font-medium text-ink-400 tracking-normal">{unit}</span>}
      </div>
      {trend && <div className="text-xs text-ink-500">{trend}</div>}
    </div>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-3">{children}</div>;
}

export function MiniStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-[0.16em] font-semibold text-ink-400">{label}</div>
      <div className="flex items-baseline gap-1 nums">
        <span className="font-display-wide text-lg text-ink-900">{value}</span>
        {unit && <span className="text-[11px] text-ink-400">{unit}</span>}
      </div>
    </div>
  );
}
