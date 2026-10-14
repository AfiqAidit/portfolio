import type { Metadata } from "next";
import { GisMapDemo } from "@/components/demos/gis-map/GisMapDemo";
import { DemoProjectHeader } from "@/components/shared/DemoProjectHeader";

const title = "GIS map demo";
const description =
  "Interactive Leaflet map of Selangor open boundary data. Pan, measure, search, and explore daerah including Hulu Langat.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", url: "/demos/gis-map", title, description },
  twitter: { card: "summary_large_image", title, description },
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
