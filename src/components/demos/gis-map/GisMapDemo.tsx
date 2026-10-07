"use client";

import dynamic from "next/dynamic";

const GisMapView = dynamic(
  () => import("./GisMapView").then((m) => ({ default: m.GisMapView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center bg-background">
        <p className="font-mono text-sm text-muted-foreground">Loading map…</p>
      </div>
    ),
  },
);

export function GisMapDemo() {
  return (
    <main className="relative min-h-0 flex-1">
      <GisMapView variant="demo" className="absolute inset-0" />
    </main>
  );
}
