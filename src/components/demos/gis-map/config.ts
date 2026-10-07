export const GIS_DEMO_PATH = "/demos/gis-map";

export const DEFAULT_CENTER: [number, number] = [3.07255, 101.84555];
export const DEFAULT_ZOOM = 11;

/** Initial map view: Hulu Langat daerah */
export const HULU_LANGAT_BOUNDS: [[number, number], [number, number]] = [
  [2.8677, 101.722],
  [3.2774, 101.9691],
];

export type MapScope = "selangor" | "malaysia";

export const SCOPE_OPTIONS: { id: MapScope; label: string }[] = [
  { id: "selangor", label: "Selangor" },
  { id: "malaysia", label: "Malaysia" },
];

export const SCOPE_BOUNDS: Record<MapScope, [[number, number], [number, number]]> = {
  selangor: [
    [2.6, 100.8],
    [3.87, 101.97],
  ],
  malaysia: [
    [0.85, 99.6],
    [7.4, 119.3],
  ],
};

export type BaseMapId = "streets" | "satellite" | "terrain" | "light" | "dark";

export type BaseMapConfig = {
  id: BaseMapId;
  label: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  subdomains?: string;
};

/** Free tile layers only (no API keys). Google Maps requires a paid API key for embeds. */
export const BASE_MAPS: BaseMapConfig[] = [
  {
    id: "streets",
    label: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  {
    id: "satellite",
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri. Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
  },
  {
    id: "terrain",
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC BY-SA)',
    maxZoom: 17,
  },
  {
    id: "light",
    label: "Light",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 16,
  },
  {
    id: "dark",
    label: "Dark",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 16,
  },
];

