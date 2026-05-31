import type { ComputedMetrics } from "@/lib/metrics/types";

interface Props {
  metrics: ComputedMetrics;
  delay?: number;
}

interface Tile {
  value: string;
  unit?: string;
  key: string;
  sub?: string;
}

function buildTiles(m: ComputedMetrics): Tile[] {
  const tiles: Tile[] = [
    {
      value: m.avgSpeedKmh.toFixed(1),
      unit: "km/h",
      key: "Avg speed",
      sub: m.maxSpeedKmh ? `max ${m.maxSpeedKmh}` : undefined,
    },
  ];

  if (m.avgPower != null) {
    tiles.push({
      value: String(Math.round(m.avgPower)),
      unit: "w",
      key: "Avg power",
      sub: m.bestPower?.s5 ? `max ${m.bestPower.s5}` : undefined,
    });
  }
  if (m.normalizedPower != null) {
    tiles.push({
      value: String(m.normalizedPower),
      unit: "w",
      key: "Norm power",
      sub: m.variabilityIndex ? `VI ${m.variabilityIndex.toFixed(2)}` : undefined,
    });
  }
  if (m.intensityFactor != null) {
    tiles.push({
      value: m.intensityFactor.toFixed(2),
      key: "Intensity",
      sub: "IF",
    });
  }

  tiles.push({
    value: String(m.tss),
    key: "Load",
    sub: m.tssSource === "power" ? "TSS" : m.tssSource === "hr" ? "hrTSS" : "suffer",
  });

  // Heart-rate column
  if (m.maxHr != null) {
    tiles.push({
      value: String(m.maxHr),
      unit: "bpm",
      key: "Max HR",
      sub: m.hrPctMax ? `${Math.round(m.hrPctMax * 100)}% of max` : undefined,
    });
  }

  // Cadence
  // not in ComputedMetrics by default — skipping unless we add it later

  // Energy
  if (m.normalizedPower != null && m.movingSec > 0) {
    const kj = Math.round((m.normalizedPower * m.movingSec) / 1000);
    tiles.push({ value: String(kj), key: "kJ / kcal", sub: "work" });
  }

  // Elevation
  if (m.elevationGain > 0) {
    tiles.push({
      value: String(Math.round(m.elevationGain)),
      unit: "m",
      key: "Elevation",
      sub: m.maxGradePct ? `${m.maxGradePct}% max` : undefined,
    });
  }

  // Drift
  if (m.cardiacDriftPct != null) {
    tiles.push({
      value: m.cardiacDriftPct.toFixed(1),
      unit: "%",
      key: "Drift",
      sub: Math.abs(m.cardiacDriftPct) < 5 ? "aerobic" : "fatigue",
    });
  }

  return tiles.slice(0, 9);
}

export function MetricGrid({ metrics, delay = 2 }: Props) {
  const tiles = buildTiles(metrics);
  return (
    <div className={`reveal delay-${delay} grid grid-cols-3 gap-2`}>
      {tiles.map((t) => (
        <div
          key={t.key}
          className="bg-paper rounded-[16px] py-3 px-2.5 border border-white shadow-soft"
        >
          <div className="font-display font-bold text-[20px] leading-none nums">
            {t.value}
            {t.unit && (
              <small className="text-[11px] font-semibold text-muted ml-0.5">
                {t.unit}
              </small>
            )}
          </div>
          <div className="mt-[5px] text-[9.5px] uppercase tracking-[0.07em] text-muted font-semibold">
            {t.key}
          </div>
          {t.sub && (
            <div className="mt-0.5 text-[10px] text-[#bdb3ab] nums">{t.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
