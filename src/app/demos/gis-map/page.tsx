import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GisMapDemo } from "@/components/demos/gis-map/GisMapDemo";

export const metadata: Metadata = {
  title: "GIS map demo",
  description:
    "Interactive Leaflet map of Selangor open boundary data. Pan, measure, search, and explore daerah including Hulu Langat.",
};

export default function GisMapDemoPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header
        className="z-50 flex shrink-0 items-center justify-between gap-3 border-b border-border px-3 py-2 sm:px-4"
        style={{ backgroundColor: "var(--nav)" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/#projects"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-accent sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            Portfolio
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
              GIS map demo
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              Selangor boundaries. Default: Hulu Langat.
            </p>
          </div>
        </div>
        <p className="hidden font-mono text-[10px] text-muted-foreground sm:block">
          OpenStreetMap and open data
        </p>
      </header>
      <GisMapDemo />
    </div>
  );
}
