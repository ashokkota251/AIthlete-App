import type { ComputedMetrics, DeepNarration } from "@/lib/metrics/types";
import { Check } from "lucide-react";

interface Props {
  metrics: ComputedMetrics;
  deep: DeepNarration;
  delay?: number;
}

const READINESS_LABEL = {
  low: "low — train easy only",
  moderate: "moderate — light to medium effort",
  high: "high — primed for quality work",
} as const;

export function RecoveryCard({ metrics, deep, delay = 6 }: Props) {
  const hours = metrics.recoveryHours;
  const freshBy = new Date(metrics.freshByISO);
  // Format "Fully fresh by Sun 6pm" — short day + 12h
  const freshByStr = freshBy.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: hours % 1 > 0 ? "2-digit" : undefined,
    hour12: true,
  });

  // Ring math — wedge proportional to time-already-recovered vs max 48h.
  const max = 48;
  const remainder = Math.max(0, Math.min(max, hours));
  const r = 29;
  const c = 2 * Math.PI * r;
  const dashOff = c * (1 - (max - remainder) / max);

  return (
    <div className={`card-recov reveal delay-${delay}`}>
      <div className="eyebrow !text-white/60">How to recover</div>

      <div className="mt-3 flex items-center gap-4">
        <svg width="70" height="70" viewBox="0 0 70 70" className="shrink-0">
          <circle cx="35" cy="35" r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="7" />
          <circle
            cx="35"
            cy="35"
            r={r}
            fill="none"
            stroke="#7BE3B8"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c.toFixed(0)}
            strokeDashoffset={dashOff.toFixed(0)}
            transform="rotate(-90 35 35)"
            style={{
              animation: "ringFill 1.1s cubic-bezier(0.4,0,0.2,1) 0.4s both",
              ["--ring-target" as never]: dashOff.toFixed(0),
            }}
          />
          <text
            x="35"
            y="34"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontWeight="700"
            fontSize="15"
            fill="#fff"
          >
            {hours}h
          </text>
          <text
            x="35"
            y="46"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontWeight="600"
            fontSize="7.5"
            fill="rgba(255,255,255,.7)"
          >
            TO FULL
          </text>
        </svg>

        <div className="flex-1 min-w-0">
          <div className="font-display font-extrabold text-[22px] leading-tight">
            Fully fresh by {freshByStr}
          </div>
          <div className="mt-1.5 text-[12.5px] text-white/80">
            Readiness today: {READINESS_LABEL[metrics.readiness]}.
          </div>
        </div>
      </div>

      <ul className="mt-3.5 pt-3 border-t border-white/15 space-y-2.5 list-none">
        {deep.restActions.map((action, i) => (
          <li key={i} className="flex gap-2.5 items-start text-[13px] leading-[1.45] text-white/92">
            <Check size={16} strokeWidth={3} className="text-[#7BE3B8] mt-0.5 shrink-0" />
            <span
              dangerouslySetInnerHTML={{
                __html: action.replace(/\*\*(.+?)\*\*/g, "<b class='font-bold'>$1</b>"),
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
