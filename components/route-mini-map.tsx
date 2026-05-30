import { decodePolyline, polylineToSvgPath } from "@/lib/polyline";

interface Props {
  polyline?: string;
  size?: number;
}

export function RouteMiniMap({ polyline, size = 96 }: Props) {
  if (!polyline) {
    return (
      <div
        className="rounded-2xl bg-cream-deep grid place-items-center text-ink-300 shrink-0"
        style={{ width: size, height: size }}
      >
        <span className="text-[9px] uppercase tracking-widest font-semibold">no map</span>
      </div>
    );
  }
  const coords = decodePolyline(polyline);
  const { d, viewBox } = polylineToSvgPath(coords, { width: size, padding: 8 });

  return (
    <div
      className="rounded-2xl bg-cream-deep overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox={viewBox} width={size} height={size} preserveAspectRatio="xMidYMid meet" className="block">
        <defs>
          <linearGradient id="mini-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF8A4D" />
            <stop offset="100%" stopColor="#B23006" />
          </linearGradient>
        </defs>
        <path d={d} stroke="rgba(242,84,27,0.15)" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke="url(#mini-stroke)" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
