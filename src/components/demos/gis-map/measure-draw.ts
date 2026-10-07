import L from "leaflet";
import {
  formatArea,
  formatLength,
  polygonAreaM2,
  polylineLengthMeters,
  polylineMidpoint,
} from "./geo-utils";

export type MeasureSketch = {
  id: string;
  type: "line" | "polygon";
  points: [number, number][];
};

function labelDivIcon(text: string) {
  return L.divIcon({
    className: "",
    html: `<span class="gis-measure-label">${text}</span>`,
    iconAnchor: [0, 0],
  });
}

function addPointMarkers(group: L.LayerGroup, points: [number, number][]) {
  for (const [lat, lng] of points) {
    L.circleMarker([lat, lng], {
      radius: 4,
      color: "#2563eb",
      fillColor: "#2563eb",
      weight: 2,
    }).addTo(group);
  }
}

export function drawMeasureOnMap(group: L.LayerGroup, sketch: MeasureSketch) {
  const { type, points } = sketch;
  if (points.length === 0) return;

  const latlngs = points.map(([lat, lng]) => L.latLng(lat, lng));
  addPointMarkers(group, points);

  if (type === "line" && points.length >= 2) {
    L.polyline(latlngs, { color: "#06b6d4", weight: 3 }).addTo(group);
    const total = formatLength(polylineLengthMeters(points));
    const mid = polylineMidpoint(points);
    L.marker(mid, { icon: labelDivIcon(total), interactive: false }).addTo(group);

  }

  if (type === "polygon" && points.length >= 3) {
    const poly = L.polygon(latlngs, {
      color: "#06b6d4",
      weight: 2,
      fillColor: "#2563eb",
      fillOpacity: 0.22,
    }).addTo(group);
    const area = formatArea(polygonAreaM2(points));
    poly.bindTooltip(area, {
      permanent: true,
      direction: "center",
      className: "gis-measure-label",
      opacity: 1,
    });
  } else if (type === "polygon" && points.length === 2) {
    L.polyline(latlngs, { color: "#06b6d4", weight: 2, dashArray: "6 4" }).addTo(group);
  }
}
