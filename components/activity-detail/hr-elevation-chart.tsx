"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Point {
  km: number;
  altitude?: number;
  hr?: number;
}

interface Props {
  distance?: number[];
  altitude?: number[];
  heartrate?: number[];
}

/**
 * Dual-axis chart: elevation profile as a coral-tinted area (left axis),
 * HR as a deep-coral line overlay (right axis). Series share the distance axis.
 */
export function HrElevationChart({ distance, altitude, heartrate }: Props) {
  if (!distance || distance.length === 0) {
    return (
      <div className="card py-8 text-center text-[12px] text-ink-400">
        No detail stream available for this activity.
      </div>
    );
  }

  // Downsample to ~140 points so the SVG stays light on mobile.
  const target = 140;
  const stride = Math.max(1, Math.floor(distance.length / target));
  const data: Point[] = [];
  for (let i = 0; i < distance.length; i += stride) {
    data.push({
      km: +(distance[i] / 1000).toFixed(2),
      altitude: altitude?.[i],
      hr: heartrate?.[i],
    });
  }
  // Always include the final point.
  if (data[data.length - 1]?.km !== +(distance[distance.length - 1] / 1000).toFixed(2)) {
    data.push({
      km: +(distance[distance.length - 1] / 1000).toFixed(2),
      altitude: altitude?.[altitude.length - 1],
      hr: heartrate?.[heartrate.length - 1],
    });
  }

  const altValues = data.map((d) => d.altitude).filter((v): v is number => v != null);
  const hrValues = data.map((d) => d.hr).filter((v): v is number => v != null);
  const altMin = altValues.length ? Math.min(...altValues) : 0;
  const altMax = altValues.length ? Math.max(...altValues) : 100;
  const altPad = Math.max(8, (altMax - altMin) * 0.18);

  return (
    <div className="card !p-3">
      <div className="px-2 pt-1 flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-ink-400">
          Elevation + Heart rate
        </span>
        <span className="flex items-center gap-3 text-[10px] text-ink-500">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-coral-300" /> Elev
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-coral-700" /> HR
          </span>
        </span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 14, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="elev-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF8A4D" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#FF8A4D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(20,16,8,0.05)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="km"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(0)}km`}
              dy={4}
              fontSize={10}
            />
            <YAxis
              yAxisId="alt"
              orientation="left"
              hide
              domain={[altMin - altPad, altMax + altPad]}
            />
            {hrValues.length > 0 && (
              <YAxis yAxisId="hr" orientation="right" hide domain={["auto", "auto"]} />
            )}
            <Tooltip content={<HrElevationTooltip />} cursor={{ stroke: "#F2541B", strokeWidth: 1, strokeDasharray: "3 3" }} />
            <Area
              yAxisId="alt"
              type="monotone"
              dataKey="altitude"
              stroke="#FF8A4D"
              strokeWidth={1.6}
              fill="url(#elev-fill)"
              dot={false}
              isAnimationActive={false}
            />
            {hrValues.length > 0 && (
              <Line
                yAxisId="hr"
                type="monotone"
                dataKey="hr"
                stroke="#B23006"
                strokeWidth={1.6}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HrElevationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Point }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-ink-900 text-paper rounded-lg px-2.5 py-1.5 text-[10px] nums shadow-xl">
      <div className="flex items-center gap-2">
        <span className="font-display nums font-semibold text-sm">{p.km.toFixed(2)} km</span>
      </div>
      <div className="flex items-center gap-3 mt-0.5 text-paper/85">
        {p.altitude != null && <span>{Math.round(p.altitude)} m</span>}
        {p.hr != null && <span>{Math.round(p.hr)} bpm</span>}
      </div>
    </div>
  );
}
