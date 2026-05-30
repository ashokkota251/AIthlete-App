import { cn } from "@/lib/cn";

interface AithleteIconProps {
  size?: number;
  className?: string;
  /** "static" — no animation; "draw" — strokes draw in once (used in splash) */
  mode?: "static" | "draw";
}

/**
 * Inline SVG version of /public/aithlete-icon.svg.
 * In "draw" mode the activity ring traces, the runner mark strokes draw in,
 * and the head dot pops — orchestrated for splash use.
 */
export function AithleteIcon({ size = 96, className, mode = "static" }: AithleteIconProps) {
  const animate = mode === "draw";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", className)}
      role="img"
      aria-label="AIthlete"
    >
      <defs>
        <linearGradient id="ai-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2541B" />
          <stop offset="1" stopColor="#FF8A4C" />
        </linearGradient>
        <radialGradient id="ai-shine" cx="30%" cy="20%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="512" height="512" rx="116" fill="url(#ai-bg)" />
      <rect width="512" height="512" rx="116" fill="url(#ai-shine)" />

      {/* Activity ring */}
      <g style={animate ? { transformOrigin: "256px 256px", animation: "ring-spin 12s linear infinite" } : undefined}>
        <circle
          cx="256"
          cy="256"
          r="186"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.18"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={animate ? "900 268" : "900 268"}
          transform="rotate(-118 256 256)"
          style={
            animate
              ? {
                  strokeDasharray: "900 268",
                  strokeDashoffset: 1168,
                  animation: "ring-trace 0.9s cubic-bezier(0.2,0.7,0.2,1) 0.05s forwards",
                }
              : undefined
          }
        />
      </g>

      {/* Runner mark: two legs + crossbar — drawn in */}
      <g fill="none" stroke="#FFFFFF" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M256 178 L184 372"
          style={animate ? drawStyle(220, 0.35) : undefined}
        />
        <path
          d="M256 178 L328 372"
          style={animate ? drawStyle(220, 0.45) : undefined}
        />
        <path
          d="M206 306 L306 306"
          style={animate ? drawStyle(110, 0.7) : undefined}
        />
      </g>

      {/* Head dot — pops last */}
      <circle
        cx="256"
        cy="150"
        r="27"
        fill="#FFFFFF"
        style={
          animate
            ? {
                transformBox: "fill-box",
                transformOrigin: "center",
                animation: "head-pop 0.55s cubic-bezier(0.2,0.8,0.2,1) 0.85s backwards",
              }
            : undefined
        }
      />
    </svg>
  );
}

function drawStyle(length: number, delaySec: number): React.CSSProperties {
  return {
    strokeDasharray: length,
    strokeDashoffset: length,
    animation: `draw-line 0.55s cubic-bezier(0.4, 0, 0.2, 1) ${delaySec}s forwards`,
  };
}

/** Strava glyph (white) */
export function StravaGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}
