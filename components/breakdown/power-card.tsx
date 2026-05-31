import type { ComputedMetrics } from "@/lib/metrics/types";

interface Props {
  metrics: ComputedMetrics;
  delay?: number;
}

export function PowerCard({ metrics, delay = 4 }: Props) {
  if (!metrics.bestPower) return null;
  const { s5, s60, s300, s1200 } = metrics.bestPower;
  const ftp = metrics.ftpEstimate;

  return (
    <div className={`card reveal delay-${delay}`}>
      <div className="grid grid-cols-4 gap-2">
        <Effort value={s5} unit="w" label="5 SEC" />
        <Effort value={s60} unit="w" label="1 MIN" />
        <Effort value={s300} unit="w" label="5 MIN" />
        <Effort value={s1200} unit="w" label="20 MIN" />
      </div>

      {ftp != null && (
        <div className="mt-3.5 flex gap-2 items-start text-[12.5px] leading-[1.5]">
          <span className="size-2.5 rounded-full bg-good shrink-0 mt-1" />
          <p className="text-ink-700">
            Your 20-min power (<b className="font-bold text-ink">{s1200} W</b>) sets an estimated FTP of{" "}
            <b className="font-bold text-ink">~{ftp} W</b>. Threshold is your reference for future intervals.
          </p>
        </div>
      )}
    </div>
  );
}

function Effort({ value, unit, label }: { value: number; unit: string; label: string }) {
  return (
    <div className="text-center bg-[#FBF3EE] rounded-[12px] py-2.5 px-1">
      <div className="font-display font-bold text-[16px] leading-none nums">
        {value}
        <small className="text-[10px] font-semibold text-muted ml-0.5">{unit}</small>
      </div>
      <div className="mt-1 text-[9px] uppercase tracking-[0.04em] text-muted font-semibold">
        {label}
      </div>
    </div>
  );
}
