import { decodePolyline, polylineToSvgPath } from "@/lib/polyline";
import { MapPin } from "lucide-react";

interface Props {
  polyline: string | null | undefined;
  className?: string;
}

export function MapPolyline({ polyline, className }: Props) {
  if (!polyline) {
    return (
      <div
        className={
          "card flex flex-col items-center justify-center text-ink-400 py-10 text-center " +
          (className ?? "")
        }
      >
        <MapPin size={20} strokeWidth={1.8} />
        <p className="text-[12px] mt-2">No route map for this activity</p>
        <p className="text-[10px] text-ink-300 mt-0.5">(treadmill, trainer, or untracked)</p>
      </div>
    );
  }

  const coords = decodePolyline(polyline);
  const { d, viewBox } = polylineToSvgPath(coords, { width: 360, padding: 12 });

  return (
    <div
      className={
        "card !p-0 overflow-hidden bg-cream-deep relative " + (className ?? "")
      }
    >
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(255,138,77,0.18), transparent 70%)",
        }}
      />
      <svg viewBox={viewBox} className="w-full h-auto block">
        {/* Subtle dotted grid for atmosphere */}
        <defs>
          <pattern id="map-grid" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="0.6" cy="0.6" r="0.6" fill="rgba(20,16,8,0.06)" />
          </pattern>
          <linearGradient id="map-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF8A4D" />
            <stop offset="100%" stopColor="#B23006" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />
        {/* Glow stroke under the line */}
        <path d={d} stroke="rgba(242,84,27,0.18)" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke="url(#map-stroke)" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Start + end dots — parse the first and last MoveTo/LineTo coords back out of d */}
        {(() => {
          const pts = Array.from(d.matchAll(/[ML]([0-9.]+)\s+([0-9.]+)/g));
          if (pts.length === 0) return null;
          const first = pts[0];
          const last = pts[pts.length - 1] ?? first;
          return (
            <>
              <circle cx={first[1]} cy={first[2]} r={4} fill="#FFFFFF" stroke="#F2541B" strokeWidth={2} />
              <circle cx={last[1]} cy={last[2]} r={4} fill="#F2541B" stroke="#FFFFFF" strokeWidth={2} />
            </>
          );
        })()}
      </svg>
    </div>
  );
}
