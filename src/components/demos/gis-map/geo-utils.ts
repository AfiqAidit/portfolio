const R = 6371000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(a: [number, number], b: [number, number]) {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function polylineLengthMeters(points: [number, number][]) {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += haversineMeters(points[i - 1], points[i]);
  }
  return sum;
}

/** Shoelace on lat/lng with local equirectangular scaling (good enough for demo polygons). */
export function polygonAreaM2(points: [number, number][]) {
  if (points.length < 3) return 0;
  const lat0 =
    points.reduce((s, p) => s + p[0], 0) / points.length;
  const cos = Math.cos(toRad(lat0));
  const xy = points.map(([lat, lng]) => [lng * cos * R * (Math.PI / 180), lat * R * (Math.PI / 180)]);
  let area = 0;
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    area += xy[i][0] * xy[j][1] - xy[j][0] * xy[i][1];
  }
  return Math.abs(area) / 2;
}

export function formatLength(m: number) {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${m.toFixed(0)} m`;
}

export function polylineMidpoint(points: [number, number][]): [number, number] {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];
  const total = polylineLengthMeters(points);
  let remaining = total / 2;
  for (let i = 1; i < points.length; i++) {
    const seg = haversineMeters(points[i - 1], points[i]);
    if (remaining <= seg) {
      const t = seg === 0 ? 0 : remaining / seg;
      return [
        points[i - 1][0] + t * (points[i][0] - points[i - 1][0]),
        points[i - 1][1] + t * (points[i][1] - points[i - 1][1]),
      ];
    }
    remaining -= seg;
  }
  return points[points.length - 1];
}

export function polygonCentroid(points: [number, number][]): [number, number] {
  if (points.length === 0) return [0, 0];
  let lat = 0;
  let lng = 0;
  for (const p of points) {
    lat += p[0];
    lng += p[1];
  }
  return [lat / points.length, lng / points.length];
}

export function formatArea(m2: number) {
  const ha = m2 / 10000;
  if (ha >= 100) return `${(m2 / 1_000_000).toFixed(2)} km2`;
  return `${ha.toFixed(2)} ha`;
}
