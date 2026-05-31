import type { ComputedMetrics } from "@/lib/metrics/types";

export function HeroStats({ metrics }: { metrics: ComputedMetrics }) {
  const movingShort = (() => {
    const h = Math.floor(metrics.movingSec / 3600);
    const m = Math.floor((metrics.movingSec % 3600) / 60);
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m}m`;
  })();

  return (
    <div className="grid grid-cols-4 gap-2 reveal delay-2">
      <Stat value={metrics.distanceKm.toFixed(1)} unit="km" />
      <Stat value={movingShort} unit="moving" />
      {metrics.avgHr != null ? (
        <Stat value={String(metrics.avgHr)} unit="avg hr" />
      ) : (
        <Stat value="—" unit="avg hr" />
      )}
      <Stat value={String(metrics.tss)} unit="load" />
    </div>
  );
}

function Stat({ value, unit }: { value: string; unit: string }) {
  return (
    <div className="bg-paper rounded-[16px] py-3 px-2 text-center shadow-soft border border-white nums">
      <div className="font-display font-bold text-[17px] leading-none">{value}</div>
      <div className="mt-1 text-[9.5px] uppercase tracking-[0.08em] text-muted font-semibold">
        {unit}
      </div>
    </div>
  );
}
