import { decodePolyline, polylineToSvgPath } from "@/lib/polyline";

interface Props {
  /** dark-card title — usually the activity name */
  title: string;
  /** ISO start date */
  startDate: string;
  /** activity type/sport label, lowercased — e.g. "gravel", "run" */
  typeLabel: string;
  polyline?: string | null;
}

export function RouteHeader({ title, startDate, typeLabel, polyline }: Props) {
  const date = new Date(startDate);
  const dayStr = date.toLocaleDateString("en-US", { weekday: "long" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const fullDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  let pathD: string | null = null;
  let viewBox = "0 0 160 120";
  if (polyline) {
    const coords = decodePolyline(polyline);
    if (coords.length > 1) {
      const proj = polylineToSvgPath(coords, { width: 160, padding: 12 });
      pathD = proj.d;
      viewBox = proj.viewBox;
    }
  }

  return (
    <div className="card-route reveal">
      {pathD && (
        <svg
          aria-hidden
          viewBox={viewBox}
          className="absolute -right-2 -top-1.5 w-[160px] h-[120px] opacity-90 pointer-events-none"
        >
          <path
            d={pathD}
            stroke="#F2541B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {(() => {
            const m = Array.from(pathD.matchAll(/[ML]([0-9.]+)\s+([0-9.]+)/g));
            if (m.length === 0) return null;
            const first = m[0];
            const last = m[m.length - 1] ?? first;
            return (
              <>
                <circle cx={first[1]} cy={first[2]} r={4} fill="#fff" />
                <circle cx={last[1]} cy={last[2]} r={4} fill="#F2541B" />
              </>
            );
          })()}
        </svg>
      )}
      <div className="eyebrow !text-white/55">
        {dayStr} · {timeStr}
      </div>
      <h2 className="mt-1.5 font-display font-bold text-[21px] leading-tight">{title}</h2>
      <div className="mt-1 text-[12px] text-white/60">
        {fullDate} · {typeLabel}
      </div>
    </div>
  );
}
