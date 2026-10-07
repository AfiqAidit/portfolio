import type { PathOptions } from "leaflet";
import { GIS_DEMO_PATH, type MapScope } from "./config";

export type DataLayerId =
  | "daerah"
  | "mukim"
  | "school"
  | "health"
  | "mosque"
  | "police"
  | "roads"
  | "rail"
  | "water"
  | "green";

export type LayerGroupId = "boundaries" | "places" | "transport" | "nature";

export type LegendShape = "polygon" | "line" | "point";

export type FeatureProps = Record<string, string | number | undefined>;

export type FeatureDetails = {
  title: string;
  subtitle: string;
  rows: [string, string][];
};

export type DataLayerConfig = {
  id: DataLayerId;
  label: string;
  group: LayerGroupId;
  file: string;
  /** Layers without this cover Selangor only */
  fileMalaysia?: string;
  defaultOn: boolean;
  legend: { shape: LegendShape; color: string };
  /** Leaflet pane; points sit above lines, lines above polygons */
  pane: "gis-boundaries" | "gis-lines" | "gis-points";
  attribution: string;
  style: (props: FeatureProps, geometryType: string) => PathOptions & { radius?: number };
  highlight: PathOptions & { radius?: number };
  describe: (props: FeatureProps) => FeatureDetails;
};

export const LAYER_GROUPS: { id: LayerGroupId; label: string }[] = [
  { id: "boundaries", label: "Boundaries" },
  { id: "places", label: "Places" },
  { id: "transport", label: "Transport" },
  { id: "nature", label: "Nature" },
];

const GEOBOUNDARIES =
  'Boundaries &copy; <a href="https://www.geoboundaries.org">geoBoundaries</a> (CC BY 4.0)';
const OSM =
  'Layer data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (ODbL)';

const DAERAH_FILL = [
  "#2563eb",
  "#06b6d4",
  "#0ea5e9",
  "#0284c7",
  "#38bdf8",
  "#22d3ee",
  "#60a5fa",
  "#0891b2",
  "#7dd3fc",
];

const ROAD_STYLE: Record<string, { color: string; weight: number }> = {
  Expressway: { color: "#e11d48", weight: 3 },
  "Trunk road": { color: "#f97316", weight: 2.5 },
  "Primary road": { color: "#f59e0b", weight: 2 },
};

export function layerFile(cfg: DataLayerConfig, scope: MapScope) {
  return scope === "malaysia" && cfg.fileMalaysia ? cfg.fileMalaysia : cfg.file;
}

function str(v: string | number | undefined) {
  return v === undefined || v === "" ? undefined : String(v);
}

function areaRow(props: FeatureProps): [string, string][] {
  if (props.area_km2 === undefined) return [];
  const ha = Number(props.area_ha ?? 0).toLocaleString();
  return [["Area (approx.)", `${props.area_km2} km2 (${ha} ha)`]];
}

function pointStyle(color: string) {
  return {
    radius: 5,
    color: "#ffffff",
    weight: 1.5,
    fillColor: color,
    fillOpacity: 0.95,
  };
}

function placeLayer(
  id: DataLayerId,
  label: string,
  color: string,
): DataLayerConfig {
  return {
    id,
    label,
    group: "places",
    file: `${GIS_DEMO_PATH}/selangor-${id}.geojson`,
    defaultOn: false,
    legend: { shape: "point", color },
    pane: "gis-points",
    attribution: OSM,
    style: () => pointStyle(color),
    highlight: { radius: 9, weight: 3, color: "#06b6d4" },
    describe: (p) => ({
      title: str(p.name) ?? label,
      subtitle: label,
      rows: [
        ...(str(p.kind) ? [["Type", String(p.kind)] as [string, string]] : []),
        ...(str(p.address) ? [["Address", String(p.address)] as [string, string]] : []),
      ],
    }),
  };
}

export const DATA_LAYERS: DataLayerConfig[] = [
  {
    id: "daerah",
    label: "Daerah",
    group: "boundaries",
    file: `${GIS_DEMO_PATH}/selangor-daerah.geojson`,
    fileMalaysia: `${GIS_DEMO_PATH}/malaysia-daerah.geojson`,
    defaultOn: true,
    legend: { shape: "polygon", color: "#2563eb" },
    pane: "gis-boundaries",
    attribution: GEOBOUNDARIES,
    style: (p) => {
      if (p.level === "wilayah") {
        return {
          color: "#64748b",
          weight: 1.5,
          dashArray: "5 4",
          fillColor: "#94a3b8",
          fillOpacity: 0.2,
        };
      }
      const fill = DAERAH_FILL[Number(p._idx ?? 0) % DAERAH_FILL.length];
      const isHulu = p.name === "Hulu Langat";
      return {
        color: isHulu ? "#06b6d4" : fill,
        weight: isHulu ? 3 : 1.5,
        fillColor: fill,
        fillOpacity: isHulu ? 0.3 : 0.18,
      };
    },
    highlight: { color: "#06b6d4", weight: 4, fillOpacity: 0.4 },
    describe: (p) => ({
      title: str(p.name) ?? "Daerah",
      subtitle:
        p.level === "wilayah"
          ? "Federal Territory (Wilayah Persekutuan)"
          : `Daerah, ${str(p.state) ?? "Selangor"}`,
      rows: [
        ...(p.level === "wilayah" ? [] : [["State", str(p.state) ?? "-"] as [string, string]]),
        ...areaRow(p),
      ],
    }),
  },
  {
    id: "mukim",
    label: "Mukim, bandar, pekan",
    group: "boundaries",
    file: `${GIS_DEMO_PATH}/selangor-mukim.geojson`,
    fileMalaysia: `${GIS_DEMO_PATH}/malaysia-mukim.geojson`,
    defaultOn: false,
    legend: { shape: "polygon", color: "#0f766e" },
    pane: "gis-boundaries",
    attribution: GEOBOUNDARIES,
    style: () => ({
      color: "#0f766e",
      weight: 1.2,
      dashArray: "4 3",
      fillColor: "#14b8a6",
      fillOpacity: 0.05,
    }),
    highlight: { color: "#0d9488", weight: 3, dashArray: "", fillOpacity: 0.3 },
    describe: (p) => ({
      title: str(p.name) ?? "Mukim",
      subtitle: `${str(p.type) ?? "Mukim"} in ${str(p.daerah) ?? "-"}, ${str(p.state) ?? "Selangor"}`,
      rows: [
        ["Type", str(p.type) ?? "Mukim"],
        ["Daerah", str(p.daerah) ?? "-"],
        ["State", str(p.state) ?? "-"],
        ...areaRow(p),
      ],
    }),
  },
  placeLayer("school", "Schools", "#7c3aed"),
  placeLayer("health", "Hospitals and clinics", "#dc2626"),
  placeLayer("mosque", "Masjid and surau", "#059669"),
  placeLayer("police", "Police stations", "#0f172a"),
  {
    id: "roads",
    label: "Main roads",
    group: "transport",
    file: `${GIS_DEMO_PATH}/selangor-roads.geojson`,
    defaultOn: false,
    legend: { shape: "line", color: "#e11d48" },
    pane: "gis-lines",
    attribution: OSM,
    style: (p) => {
      const s = ROAD_STYLE[String(p.kind)] ?? ROAD_STYLE["Primary road"];
      return { color: s.color, weight: s.weight, opacity: 0.9 };
    },
    highlight: { color: "#06b6d4", weight: 6, opacity: 1 },
    describe: (p) => ({
      title: str(p.name) ?? "Road",
      subtitle: "Main roads",
      rows: [
        ["Type", str(p.kind) ?? "Road"],
        ...(str(p.ref) ? [["Route", String(p.ref)] as [string, string]] : []),
      ],
    }),
  },
  {
    id: "rail",
    label: "Rail and stations",
    group: "transport",
    file: `${GIS_DEMO_PATH}/selangor-rail.geojson`,
    defaultOn: false,
    legend: { shape: "line", color: "#db2777" },
    pane: "gis-lines",
    attribution: OSM,
    style: (_p, geometryType) =>
      geometryType === "Point"
        ? { radius: 4, color: "#db2777", weight: 2, fillColor: "#ffffff", fillOpacity: 1 }
        : { color: "#db2777", weight: 3, opacity: 0.9 },
    highlight: { color: "#06b6d4", weight: 6, radius: 7 },
    describe: (p) => ({
      title: str(p.name) ?? "Rail",
      subtitle: p.feature === "station" ? "Rail station" : "Rail line",
      rows: [["Type", str(p.kind) ?? "Rail"]],
    }),
  },
  {
    id: "water",
    label: "Rivers and lakes",
    group: "nature",
    file: `${GIS_DEMO_PATH}/selangor-water.geojson`,
    defaultOn: false,
    legend: { shape: "line", color: "#0284c7" },
    pane: "gis-lines",
    attribution: OSM,
    style: (_p, geometryType) =>
      geometryType.includes("Polygon")
        ? { color: "#0284c7", weight: 1, fillColor: "#38bdf8", fillOpacity: 0.5 }
        : { color: "#0284c7", weight: 1.8, opacity: 0.9 },
    highlight: { color: "#06b6d4", weight: 5, fillOpacity: 0.7 },
    describe: (p) => ({
      title: str(p.name) ?? "Water",
      subtitle: "Rivers and lakes",
      rows: [["Type", str(p.kind) ?? "Water"]],
    }),
  },
  {
    id: "green",
    label: "Parks and forest reserves",
    group: "nature",
    file: `${GIS_DEMO_PATH}/selangor-green.geojson`,
    defaultOn: false,
    legend: { shape: "polygon", color: "#16a34a" },
    pane: "gis-boundaries",
    attribution: OSM,
    style: () => ({ color: "#15803d", weight: 1, fillColor: "#16a34a", fillOpacity: 0.25 }),
    highlight: { color: "#06b6d4", weight: 3, fillOpacity: 0.45 },
    describe: (p) => ({
      title: str(p.name) ?? "Green area",
      subtitle: "Parks and forest reserves",
      rows: [["Type", str(p.kind) ?? "Green area"]],
    }),
  },
];

export const LAYER_PANES = [
  { name: "gis-boundaries", zIndex: 350 },
  { name: "gis-lines", zIndex: 370 },
  { name: "gis-points", zIndex: 390 },
] as const;
