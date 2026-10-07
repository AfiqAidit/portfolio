"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./gis-map.css";

const GisMapView = dynamic(
  () => import("./GisMapView").then((m) => ({ default: m.GisMapView })),
  { ssr: false },
);

export function GisMapCardPreview() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      href="/demos/gis-map"
      className="group/preview relative block aspect-[16/10] w-full overflow-hidden border-b border-border bg-background/30"
    >
      <div ref={rootRef} className="absolute inset-0">
        {visible ? (
          <GisMapView variant="preview" className="h-full" />
        ) : (
          <div
            className="h-full w-full animate-pulse bg-gradient-to-br from-card to-band"
            aria-hidden
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 to-transparent opacity-0 transition group-hover/preview:opacity-100"
          aria-hidden
        />
        <span className="gis-surface pointer-events-none absolute bottom-3 right-3 rounded-full border border-border bg-card/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
          Open full map
        </span>
      </div>
    </Link>
  );
}
