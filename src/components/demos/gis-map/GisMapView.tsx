"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Hexagon,
  Layers,
  LocateFixed,
  MapPin,
  PencilRuler,
  Ruler,
  Trash2,
  X,
} from "lucide-react";
import type { GeocodeResult } from "@/app/api/demos/gis-map/geocode/route";
import {
  BASE_MAPS,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  HULU_LANGAT_BOUNDS,
  SCOPE_BOUNDS,
  SCOPE_OPTIONS,
  type BaseMapId,
  type MapScope,
} from "./config";
import {
  DATA_LAYERS,
  LAYER_GROUPS,
  LAYER_PANES,
  layerFile,
  type DataLayerConfig,
  type DataLayerId,
  type FeatureDetails,
  type FeatureProps,
  type LegendShape,
} from "./data-layers";
import { BaseMapDropdown } from "./BaseMapDropdown";
import { drawMeasureOnMap, type MeasureSketch } from "./measure-draw";
import "./gis-map.css";

type ActiveMeasureMode = "line" | "polygon" | null;

type Props = {
  variant: "demo" | "preview";
  className?: string;
};

type Selection = {
  details: FeatureDetails;
  latlng: L.LatLng;
};

type SelectedLeaf = {
  cfg: DataLayerConfig;
  feature: GeoJSON.Feature;
  layer: L.Path;
};

type LayerStatus = Partial<Record<DataLayerId, "loading" | "error">>;

const DEFAULT_LAYER_ON = Object.fromEntries(
  DATA_LAYERS.map((l) => [l.id, l.defaultOn]),
) as Record<DataLayerId, boolean>;

function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function newSketchId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function featureStyle(cfg: DataLayerConfig, feature: GeoJSON.Feature) {
  return cfg.style((feature.properties ?? {}) as FeatureProps, feature.geometry.type);
}

function LegendSwatch({ shape, color }: { shape: LegendShape; color: string }) {
  if (shape === "line") {
    return (
      <span className="h-1 w-4 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
    );
  }
  if (shape === "point") {
    return (
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white"
        style={{ backgroundColor: color }}
        aria-hidden
      />
    );
  }
  return (
    <span
      className="h-3 w-3 shrink-0 rounded-sm border"
      style={{ backgroundColor: `${color}55`, borderColor: color }}
      aria-hidden
    />
  );
}

export function GisMapView({ variant, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const pointsRendererRef = useRef<L.Canvas | null>(null);
  const layerGroupsRef = useRef<Partial<Record<DataLayerId, L.GeoJSON>>>({});
  const groupCacheRef = useRef(new Map<string, L.GeoJSON>());
  const loadingRef = useRef(new Set<string>());
  const scopeRef = useRef<MapScope>("selangor");
  const layerOnRef = useRef<Record<DataLayerId, boolean>>(DEFAULT_LAYER_ON);
  const selectedLeafRef = useRef<SelectedLeaf | null>(null);
  const layerHitsRef = useRef(new Map<string, SelectedLeaf>());
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const locateLayerRef = useRef<L.LayerGroup | null>(null);
  const pinsLayerRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeMeasureRef = useRef<ActiveMeasureMode>(null);
  const pinModeRef = useRef(false);
  const measureMenuRef = useRef<HTMLDivElement>(null);

  const isPreview = variant === "preview";

  const [baseMapId, setBaseMapId] = useState<BaseMapId>("streets");
  const [layerOn, setLayerOn] = useState<Record<DataLayerId, boolean>>(DEFAULT_LAYER_ON);
  const [layerStatus, setLayerStatus] = useState<LayerStatus>({});
  const [layersOpen, setLayersOpen] = useState(false);
  const [scope, setScope] = useState<MapScope>("selangor");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [activeMeasure, setActiveMeasure] = useState<ActiveMeasureMode>(null);
  const [activePoints, setActivePoints] = useState<[number, number][]>([]);
  const [finishedMeasures, setFinishedMeasures] = useState<MeasureSketch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [measureMenuOpen, setMeasureMenuOpen] = useState(false);
  const [pinMode, setPinMode] = useState(false);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    activeMeasureRef.current = activeMeasure;
  }, [activeMeasure]);

  useEffect(() => {
    pinModeRef.current = pinMode;
  }, [pinMode]);

  useEffect(() => {
    if (!measureMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!measureMenuRef.current?.contains(e.target as Node)) {
        setMeasureMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [measureMenuOpen]);

  const applyBaseMap = useCallback((map: L.Map, id: BaseMapId) => {
    const cfg = BASE_MAPS.find((b) => b.id === id) ?? BASE_MAPS[0];
    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
    }
    const tile = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom ?? 19,
      subdomains: cfg.subdomains ?? "abc",
    });
    tile.addTo(map);
    baseLayerRef.current = tile;
  }, []);

  const clearSelection = useCallback(() => {
    const prev = selectedLeafRef.current;
    if (prev) prev.layer.setStyle(featureStyle(prev.cfg, prev.feature));
    selectedLeafRef.current = null;
    setSelected(null);
  }, []);

  const selectFeature = useCallback(
    (cfg: DataLayerConfig, feature: GeoJSON.Feature, layer: L.Path, latlng: L.LatLng) => {
      const prev = selectedLeafRef.current;
      if (prev) prev.layer.setStyle(featureStyle(prev.cfg, prev.feature));
      layer.setStyle(cfg.highlight);
      layer.bringToFront();
      selectedLeafRef.current = { cfg, feature, layer };
      setSelected({
        details: cfg.describe((feature.properties ?? {}) as FeatureProps),
        latlng,
      });
    },
    [],
  );

  const buildLayer = useCallback(
    (cfg: DataLayerConfig, data: GeoJSON.FeatureCollection) => {
      data.features.forEach((f, i) => {
        f.properties = { ...(f.properties ?? {}), _idx: i };
      });
      return L.geoJSON(data, {
        pane: cfg.pane,
        attribution: cfg.attribution,
        interactive: !isPreview,
        style: (feature) => (feature ? featureStyle(cfg, feature) : {}),
        pointToLayer: (feature, latlng) =>
          L.circleMarker(latlng, {
            ...featureStyle(cfg, feature),
            pane: cfg.pane,
            renderer: pointsRendererRef.current ?? undefined,
            interactive: !isPreview,
          }),
        onEachFeature: (feature, layer) => {
          if (isPreview) return;
          layer.on("click", (e: L.LeafletMouseEvent) => {
            if (activeMeasureRef.current || pinModeRef.current) return;
            L.DomEvent.stopPropagation(e);
            selectFeature(cfg, feature, layer as L.Path, e.latlng);
          });
        },
      });
    },
    [isPreview, selectFeature],
  );

  const showLayer = useCallback(
    async (id: DataLayerId) => {
      const map = mapRef.current;
      const cfg = DATA_LAYERS.find((l) => l.id === id);
      if (!map || !cfg) return;
      const file = layerFile(cfg, scopeRef.current);
      const isCurrent = () =>
        mapRef.current === map &&
        layerOnRef.current[id] &&
        layerFile(cfg, scopeRef.current) === file;

      let group = groupCacheRef.current.get(file);
      if (!group) {
        const loading = loadingRef.current;
        if (loading.has(file)) return;
        loading.add(file);
        setLayerStatus((s) => ({ ...s, [id]: "loading" }));
        try {
          const res = await fetch(file);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as GeoJSON.FeatureCollection;
          if (mapRef.current !== map) return;
          group = buildLayer(cfg, data);
          groupCacheRef.current.set(file, group);
          setLayerStatus((s) => ({ ...s, [id]: undefined }));
        } catch {
          if (mapRef.current === map) setLayerStatus((s) => ({ ...s, [id]: "error" }));
          return;
        } finally {
          loading.delete(file);
        }
      }
      if (!isCurrent()) return;
      const shown = layerGroupsRef.current[id];
      if (shown && shown !== group) map.removeLayer(shown);
      layerGroupsRef.current[id] = group;
      group.addTo(map);
    },
    [buildLayer],
  );

  const hideLayer = (id: DataLayerId) => {
    const map = mapRef.current;
    const group = layerGroupsRef.current[id];
    if (map && group) map.removeLayer(group);
    delete layerGroupsRef.current[id];
    if (selectedLeafRef.current?.cfg.id === id) clearSelection();
  };

  const setLayers = (ids: DataLayerId[], on: boolean) => {
    const next = { ...layerOnRef.current };
    for (const id of ids) next[id] = on;
    layerOnRef.current = next;
    setLayerOn(next);
    setLayerStatus((s) => {
      const copy = { ...s };
      for (const id of ids) if (copy[id] === "error") delete copy[id];
      return copy;
    });
    for (const id of ids) {
      if (on) void showLayer(id);
      else hideLayer(id);
    }
  };

  const toggleLayer = (id: DataLayerId, on: boolean) => setLayers([id], on);

  const allLayerIds = DATA_LAYERS.map((l) => l.id);
  const allOn = allLayerIds.every((id) => layerOn[id]);
  const noneOn = allLayerIds.every((id) => !layerOn[id]);

  const changeScope = (next: MapScope) => {
    if (next === scopeRef.current) return;
    scopeRef.current = next;
    setScope(next);
    for (const cfg of DATA_LAYERS) {
      if (!cfg.fileMalaysia) continue;
      hideLayer(cfg.id);
      if (layerOnRef.current[cfg.id]) void showLayer(cfg.id);
    }
    const [sw, ne] = SCOPE_BOUNDS[next];
    mapRef.current?.fitBounds(L.latLngBounds(sw, ne), {
      padding: [24, 24],
      animate: !prefersReducedMotion,
    });
  };

  const commitActiveMeasure = useCallback(() => {
    if (!activeMeasure || activePoints.length === 0) {
      setActivePoints([]);
      return;
    }
    const min = activeMeasure === "line" ? 2 : 3;
    if (activePoints.length >= min) {
      setFinishedMeasures((prev) => [
        ...prev,
        { id: newSketchId(), type: activeMeasure, points: activePoints },
      ]);
    }
    setActivePoints([]);
  }, [activeMeasure, activePoints]);

  const toggleMeasure = (mode: "line" | "polygon") => {
    setPinMode(false);
    if (activeMeasure === mode) {
      commitActiveMeasure();
      setActiveMeasure(null);
      return;
    }
    if (activeMeasure) commitActiveMeasure();
    setActiveMeasure(mode);
    setActivePoints([]);
  };

  const clearAllMeasures = () => {
    setActiveMeasure(null);
    setActivePoints([]);
    setFinishedMeasures([]);
  };

  const togglePinMode = () => {
    if (!pinMode) {
      if (activeMeasure) commitActiveMeasure();
      setActiveMeasure(null);
      setMeasureMenuOpen(false);
    }
    setPinMode((on) => !on);
  };

  const clearPins = () => {
    pinsLayerRef.current?.clearLayers();
  };

  const dropPin = useCallback((lat: number, lng: number) => {
    const pins = pinsLayerRef.current;
    if (!pins) return;
    const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    L.marker([lat, lng])
      .addTo(pins)
      .bindPopup(`<span style="font-family:monospace;font-size:12px">${label}</span>`)
      .openPopup();
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    fixLeafletIcons();

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: !isPreview,
      scrollWheelZoom: !isPreview,
      dragging: !isPreview,
      doubleClickZoom: !isPreview,
      boxZoom: !isPreview,
      keyboard: !isPreview,
      touchZoom: !isPreview,
    });
    if (!isPreview) L.control.zoom({ position: "bottomright" }).addTo(map);

    for (const p of LAYER_PANES) {
      map.createPane(p.name).style.zIndex = String(p.zIndex);
    }
    pointsRendererRef.current = L.canvas({ pane: "gis-points", padding: 0.3 });

    mapRef.current = map;
    measureLayerRef.current = L.layerGroup().addTo(map);
    overlayLayerRef.current = L.layerGroup().addTo(map);
    pinsLayerRef.current = L.layerGroup().addTo(map);

    map.fitBounds(L.latLngBounds(HULU_LANGAT_BOUNDS[0], HULU_LANGAT_BOUNDS[1]), {
      padding: [24, 24],
      animate: false,
    });

    applyBaseMap(map, baseMapId);

    for (const cfg of DATA_LAYERS) {
      if (layerOnRef.current[cfg.id]) void showLayer(cfg.id);
    }

    if (!isPreview) {
      map.on("click", (e) => {
        if (pinModeRef.current) {
          dropPin(e.latlng.lat, e.latlng.lng);
          return;
        }
        if (!activeMeasureRef.current) return;
        const pt: [number, number] = [e.latlng.lat, e.latlng.lng];
        setActivePoints((prev) => [...prev, pt]);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupsRef.current = {};
      groupCacheRef.current = new Map();
      loadingRef.current = new Set();
      selectedLeafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applyBaseMap(map, baseMapId);
  }, [applyBaseMap, baseMapId]);

  useEffect(() => {
    const group = measureLayerRef.current;
    if (!group) return;
    group.clearLayers();
    for (const sketch of finishedMeasures) {
      drawMeasureOnMap(group, sketch);
    }
    if (activeMeasure && activePoints.length > 0) {
      drawMeasureOnMap(group, {
        id: "active",
        type: activeMeasure,
        points: activePoints,
      });
    }
  }, [finishedMeasures, activeMeasure, activePoints]);

  const goTo = (lat: number, lng: number, zoom = 13) => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([lat, lng], zoom, { animate: !prefersReducedMotion });
  };

  const placeSearchMarker = (lat: number, lng: number, label: string) => {
    const overlay = overlayLayerRef.current;
    if (!overlay) return;
    if (searchMarkerRef.current) {
      overlay.removeLayer(searchMarkerRef.current);
    }
    const marker = L.marker([lat, lng]).addTo(overlay);
    marker.bindPopup(label).openPopup();
    searchMarkerRef.current = marker;
  };

  const layerSearchHits = useCallback((q: string) => {
    const lower = q.toLowerCase();
    const hits: GeocodeResult[] = [];
    layerHitsRef.current.clear();
    for (const cfg of DATA_LAYERS) {
      const group = layerGroupsRef.current[cfg.id];
      if (!group || !layerOnRef.current[cfg.id]) continue;
      group.eachLayer((leaf) => {
        if (hits.length >= 8) return;
        const feature = (leaf as L.Path & { feature?: GeoJSON.Feature }).feature;
        const name = String(feature?.properties?.name ?? "");
        if (!feature || !name.toLowerCase().includes(lower)) return;
        const center =
          leaf instanceof L.CircleMarker
            ? leaf.getLatLng()
            : (leaf as L.Polyline).getBounds().getCenter();
        const id = `layer:${cfg.id}:${feature.properties?._idx}`;
        layerHitsRef.current.set(id, { cfg, feature, layer: leaf as L.Path });
        hits.push({
          id,
          title: name,
          label: `On the map: ${cfg.label}`,
          lat: center.lat,
          lng: center.lng,
          source: "layer",
        });
      });
    }
    return hits;
  }, []);

  const fetchPlaceSuggestions = useCallback(
    async (q: string): Promise<GeocodeResult[]> => {
      const layerHits = layerSearchHits(q);
      try {
        const res = await fetch(`/api/demos/gis-map/geocode?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
        });
        if (!res.ok) return layerHits;
        const remote = (await res.json()) as GeocodeResult[];
        const merged = [...layerHits];
        const keys = new Set(layerHits.map((h) => `${h.lat.toFixed(4)}-${h.title.toLowerCase()}`));
        for (const item of remote) {
          const key = `${item.lat.toFixed(4)}-${item.title.toLowerCase()}`;
          if (!keys.has(key)) {
            merged.push(item);
            keys.add(key);
          }
        }
        return merged.slice(0, 15);
      } catch {
        return layerHits;
      }
    },
    [layerSearchHits],
  );

  const selectSearchResult = (item: GeocodeResult) => {
    setSearchQuery(item.title);
    setSearchOpen(false);
    setSearchResults([]);
    setSearchLoading(false);

    const hit = item.source === "layer" ? layerHitsRef.current.get(item.id) : undefined;
    const map = mapRef.current;
    if (hit && map) {
      const animate = !prefersReducedMotion;
      if (hit.layer instanceof L.CircleMarker) {
        map.setView(hit.layer.getLatLng(), 17, { animate });
      } else {
        map.fitBounds((hit.layer as L.Polyline).getBounds(), {
          padding: [40, 40],
          maxZoom: 15,
          animate,
        });
      }
      selectFeature(hit.cfg, hit.feature, hit.layer, L.latLng(item.lat, item.lng));
      return;
    }
    goTo(item.lat, item.lng, 16);
    placeSearchMarker(item.lat, item.lng, item.label);
  };

  const runSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(true);
    setSearchLoading(true);
    const merged = await fetchPlaceSuggestions(q);
    setSearchLoading(false);
    setSearchResults(merged);
    setSearchOpen(true);
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchLoading(true);
      setSearchOpen(true);
      void fetchPlaceSuggestions(q).then((merged) => {
        setSearchLoading(false);
        setSearchResults(merged);
        setSearchOpen(true);
      });
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, fetchPlaceSuggestions]);

  const locateMe = () => {
    setLocateError(null);
    if (!navigator.geolocation) {
      setLocateError("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        goTo(lat, lng, 16);
        const overlay = overlayLayerRef.current;
        if (!overlay) return;
        if (locateLayerRef.current) overlay.removeLayer(locateLayerRef.current);
        const accuracyCircle = L.circle([lat, lng], {
          radius: accuracy,
          color: "#2563eb",
          weight: 1,
          fillColor: "#3b82f6",
          fillOpacity: 0.12,
          interactive: false,
        });
        const dot = L.marker([lat, lng], {
          icon: L.divIcon({
            className: "gis-locate-dot",
            html: "<span></span>",
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            popupAnchor: [0, -10],
          }),
          zIndexOffset: 1000,
        }).bindPopup(
          `<strong>You are here</strong><br><span style="font-family:monospace;font-size:12px">${lat.toFixed(5)}, ${lng.toFixed(5)}</span><br><span style="font-size:11px;opacity:.7">Accuracy about ${Math.round(accuracy)} m</span>`,
        );
        locateLayerRef.current = L.layerGroup([accuracyCircle, dot]).addTo(overlay);
        dot.openPopup();
      },
      () => {
        setLocateError("Location permission denied or unavailable.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const panelClass =
    "rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-sm";

  const showSearchPanel = searchOpen && searchQuery.trim().length >= 2;

  const toolBtnClass = (active: boolean) =>
    `inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
      active
        ? "border-accent bg-accent/15 text-accent"
        : "border-border bg-background text-muted-foreground hover:border-accent/40"
    }`;

  return (
    <div className={`gis-map-root relative flex h-full min-h-0 flex-col ${className}`}>
      <div
        ref={containerRef}
        className={`min-h-0 flex-1 ${isPreview ? "gis-map-preview" : "min-h-[50vh] md:min-h-0"}`}
        aria-label={isPreview ? "Map preview" : "Interactive GIS map"}
      />

      {!isPreview ? (
        <>
          <div
            className={`pointer-events-auto absolute left-3 right-16 top-3 z-[1000] flex flex-col gap-2 md:right-auto md:max-w-[28rem] ${panelClass}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative shrink-0" ref={measureMenuRef}>
                <button
                  type="button"
                  title="Measure tools"
                  aria-label="Measure tools"
                  aria-expanded={measureMenuOpen}
                  className={toolBtnClass(measureMenuOpen || activeMeasure !== null)}
                  onClick={() => setMeasureMenuOpen((o) => !o)}
                >
                  <PencilRuler className="h-4 w-4" aria-hidden />
                </button>
                {measureMenuOpen ? (
                  <div
                    className="absolute left-0 top-full z-30 mt-1 flex items-center gap-1 rounded-xl border border-border bg-card p-1.5 shadow-lg"
                    role="toolbar"
                    aria-label="Measure"
                  >
                    <button
                      type="button"
                      title="Measure distance"
                      aria-label="Measure distance"
                      aria-pressed={activeMeasure === "line"}
                      className={toolBtnClass(activeMeasure === "line")}
                      onClick={() => {
                        toggleMeasure("line");
                        setMeasureMenuOpen(false);
                      }}
                    >
                      <Ruler className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      title="Measure area"
                      aria-label="Measure area"
                      aria-pressed={activeMeasure === "polygon"}
                      className={toolBtnClass(activeMeasure === "polygon")}
                      onClick={() => {
                        toggleMeasure("polygon");
                        setMeasureMenuOpen(false);
                      }}
                    >
                      <Hexagon className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      title="Clear all measurements"
                      aria-label="Clear all measurements"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:border-red-400/50 hover:text-red-500"
                      onClick={() => {
                        clearAllMeasures();
                        setMeasureMenuOpen(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                title="Drop coordinate pin"
                aria-label="Drop coordinate pin on map"
                aria-pressed={pinMode}
                className={toolBtnClass(pinMode)}
                onClick={togglePinMode}
              >
                <MapPin className="h-4 w-4" aria-hidden />
              </button>

              <div className="relative min-w-[10rem] flex-1">
                <label className="sr-only" htmlFor="gis-search">
                  Search places, businesses, or map layers
                </label>
                <div className="flex gap-2">
                  <input
                    id="gis-search"
                    type="search"
                    role="combobox"
                    aria-expanded={showSearchPanel}
                    aria-controls="gis-search-list"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      if (value.trim().length < 2) {
                        setSearchResults([]);
                        setSearchOpen(false);
                        setSearchLoading(false);
                      } else {
                        setSearchOpen(true);
                        setSearchLoading(true);
                      }
                    }}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 2) setSearchOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void runSearch();
                      if (e.key === "Escape") setSearchOpen(false);
                    }}
                    placeholder="Search place, daerah, mukim…"
                    className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
                  />
                  <button
                    type="button"
                    onClick={() => void runSearch()}
                    className="shrink-0 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                  >
                    Go
                  </button>
                </div>
              </div>

              <button
                type="button"
                title="Locate me"
                aria-label="Locate me"
                className={toolBtnClass(false)}
                onClick={locateMe}
              >
                <LocateFixed className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {locateError ? <p className="text-xs text-red-500">{locateError}</p> : null}

            {showSearchPanel ? (
              <ul
                id="gis-search-list"
                role="listbox"
                className="max-h-60 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg"
              >
                {searchLoading ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground" role="presentation">
                    Searching…
                  </li>
                ) : null}
                {!searchLoading &&
                  searchResults.map((item) => (
                    <li key={`${item.id}-${item.lat}`} role="option" aria-selected={false}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-band"
                        onClick={() => selectSearchResult(item)}
                      >
                        <span className="block text-sm font-medium text-foreground">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
                          {item.label}
                        </span>
                      </button>
                    </li>
                  ))}
                {!searchLoading && searchResults.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground" role="presentation">
                    No results in OpenStreetMap for this query.
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>

          <button
            type="button"
            title="Base map and layers"
            aria-label="Base map and layers"
            aria-expanded={layersOpen}
            className={`absolute right-3 top-3 z-[1001] md:hidden ${toolBtnClass(layersOpen)} bg-card`}
            onClick={() => setLayersOpen((o) => !o)}
          >
            <Layers className="h-4 w-4" aria-hidden />
          </button>

          <div
            className={`pointer-events-auto absolute right-3 top-16 z-[1000] w-60 md:top-3 ${
              layersOpen ? "block" : "hidden"
            } md:block ${panelClass}`}
          >
            <div>
              <p className="font-mono text-xs text-accent">Base map</p>
              <BaseMapDropdown value={baseMapId} onChange={setBaseMapId} />
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs text-accent">Layers</p>
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    className="text-accent hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
                    disabled={allOn}
                    onClick={() => setLayers(allLayerIds, true)}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="text-accent hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
                    disabled={noneOn}
                    onClick={() => setLayers(allLayerIds, false)}
                  >
                    Deselect all
                  </button>
                </div>
              </div>
              <div
                role="radiogroup"
                aria-label="Boundary coverage"
                className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-border bg-background/60 p-0.5 text-xs"
              >
                {SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={scope === opt.id}
                    className={`rounded-md px-2 py-1 transition-colors ${
                      scope === opt.id
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => changeScope(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                {LAYER_GROUPS.map((group) => (
                  <div key={group.id}>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                      {group.label}
                      {scope === "malaysia" && group.id !== "boundaries" ? (
                        <span className="ml-1 normal-case tracking-normal text-muted-foreground">
                          (Selangor only)
                        </span>
                      ) : null}
                    </p>
                    <ul className="mt-1.5 space-y-1.5 text-sm">
                      {DATA_LAYERS.filter((l) => l.group === group.id).map((layer) => (
                        <li key={layer.id}>
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={layerOn[layer.id]}
                              onChange={(e) => toggleLayer(layer.id, e.target.checked)}
                              className="accent-[var(--accent)]"
                            />
                            <LegendSwatch shape={layer.legend.shape} color={layer.legend.color} />
                            <span className="min-w-0 flex-1 truncate text-foreground">
                              {layer.label}
                            </span>
                            {layerStatus[layer.id] === "loading" ? (
                              <span className="font-mono text-[10px] text-muted-foreground">
                                Loading
                              </span>
                            ) : layerStatus[layer.id] === "error" ? (
                              <span className="font-mono text-[10px] text-red-500">Failed</span>
                            ) : null}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {activeMeasure || pinMode ? (
            <div
              className="pointer-events-auto absolute left-3 top-[7.5rem] z-[999] max-w-[28rem] font-mono text-[10px] text-muted-foreground"
              aria-live="polite"
            >
              {pinMode
                ? "Pin mode: tap the map to drop a marker with latitude and longitude."
                : activeMeasure === "line"
                  ? "Distance: tap the map to add points. Open measure tools and tap ruler again to finish."
                  : "Area: tap at least 3 corners. Open measure tools and tap area again to finish."}
              {pinMode ? (
                <button type="button" className="ml-2 text-accent underline" onClick={clearPins}>
                  Clear pins
                </button>
              ) : null}
            </div>
          ) : null}

          {selected ? (
            <div
              className={`pointer-events-auto absolute bottom-3 left-3 z-[1000] w-[min(calc(100%-5rem),22rem)] ${panelClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">
                    {selected.details.subtitle}
                  </p>
                  <p className="mt-0.5 text-lg font-semibold leading-snug text-foreground">
                    {selected.details.title}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close details"
                  onClick={clearSelection}
                  className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-band hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                {selected.details.rows.map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
                    <dd className="min-w-0 text-foreground">{value}</dd>
                  </div>
                ))}
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-muted-foreground">Location</dt>
                  <dd className="font-mono text-xs leading-5 text-foreground">
                    {selected.latlng.lat.toFixed(5)}, {selected.latlng.lng.toFixed(5)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
