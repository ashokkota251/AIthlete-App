/**
 * Decode a Google-encoded polyline string into [lat, lng] pairs.
 * Strava uses the same encoding for `map.polyline` / `map.summary_polyline`.
 * Algorithm reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): [number, number][] {
  if (!encoded) return [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coords: [number, number][] = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coords.push([lat * 1e-5, lng * 1e-5]);
  }

  return coords;
}

/**
 * Project lat/lng coordinates into a fixed viewBox using Web Mercator,
 * preserving aspect ratio. Returns SVG path "d" attribute string + the
 * computed viewBox.
 */
export function polylineToSvgPath(
  coords: [number, number][],
  opts: { width?: number; padding?: number } = {},
): { d: string; viewBox: string; bounds: { minX: number; minY: number; maxX: number; maxY: number } } {
  const padding = opts.padding ?? 8;
  if (coords.length < 2) {
    return {
      d: "",
      viewBox: "0 0 100 100",
      bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    };
  }

  // Web Mercator projection (normalised — we only need relative positions)
  const projected = coords.map(([lat, lng]) => {
    const x = lng;
    const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2));
    return [x, y] as const;
  });

  const xs = projected.map((p) => p[0]);
  const ys = projected.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;

  // Fixed aspect ratio — let the SVG itself letterbox.
  const aspect = dx / dy;
  const width = opts.width ?? 200;
  const height = width / aspect;

  const pts = projected.map(([x, y]) => {
    const nx = ((x - minX) / dx) * (width - padding * 2) + padding;
    const ny = ((maxY - y) / dy) * (height - padding * 2) + padding;
    return [nx, ny] as const;
  });

  const d = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  return {
    d,
    viewBox: `0 0 ${width.toFixed(2)} ${height.toFixed(2)}`,
    bounds: { minX, minY, maxX, maxY },
  };
}
