import type { Metadata } from "next";
import { GisMapDemo } from "@/components/demos/gis-map/GisMapDemo";
import { DemoProjectHeader } from "@/components/shared/DemoProjectHeader";

export const metadata: Metadata = {
  title: "GIS map demo",
  description:
    "Interactive Leaflet map of Selangor open boundary data. Pan, measure, search, and explore daerah including Hulu Langat.",
};

export default function GisMapDemoPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <DemoProjectHeader
        title="GIS map demo"
        subtitle="Selangor boundaries. Default: Hulu Langat."
        aside={
          <p className="hidden font-mono text-[10px] text-muted-foreground sm:block">
            OpenStreetMap and open data
          </p>
        }
      />
      <GisMapDemo />
    </div>
  );
}
