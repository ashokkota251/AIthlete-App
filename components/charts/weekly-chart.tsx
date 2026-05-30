"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export interface WeeklyPoint {
  day: string;
  km: number;
  date: string;
}

export function WeeklyChart({ data }: { data: WeeklyPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.km));
  return (
    <div className="h-[148px] -mx-2">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 14, right: 14, left: 14, bottom: 0 }}>
          <defs>
            <linearGradient id="coralFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F2541B" stopOpacity={0.32} />
              <stop offset="80%" stopColor="#F2541B" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="coralStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF8A4D" />
              <stop offset="100%" stopColor="#F2541B" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(20,16,8,0.05)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} dy={4} />
          <YAxis hide domain={[0, max * 1.2]} />
          <Tooltip
            cursor={{ stroke: "#F2541B", strokeWidth: 1, strokeDasharray: "3 3" }}
            content={<DotTooltip />}
          />
          <Area
            type="monotone"
            dataKey="km"
            stroke="url(#coralStroke)"
            strokeWidth={2.5}
            fill="url(#coralFill)"
            dot={{ r: 3, fill: "#F2541B", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "#F2541B", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DotTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: WeeklyPoint }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-ink-900 text-paper rounded-lg px-2.5 py-1.5 text-[11px] shadow-xl">
      <span className="font-display nums font-semibold text-sm">{p.km.toFixed(1)} km</span>{" "}
      <span className="text-paper/70">· {p.day}</span>
    </div>
  );
}
