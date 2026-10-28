import type { Metadata } from "next";
import { PassCard } from "@/components/shared/PassCard";
import { DemoProjectHeader } from "@/components/shared/DemoProjectHeader";

const title = "Hanging pass";
const description =
  "Pull the nylon strap, let the badge bounce, and click to flip it. A CSS 3D pass for this site.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", url: "/demos/pass", title, description },
  twitter: { card: "summary_large_image", title, description },
};

export default function PassDemoPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <DemoProjectHeader
        title="Hanging pass"
        subtitle="Drag to pull. Click to flip."
        aside={
          <p className="hidden font-mono text-[10px] text-muted-foreground sm:block">
            CSS 3D, no WebGL
          </p>
        }
      />
      <div className="relative min-h-0 flex-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border)_1.1px,transparent_1.1px)] [background-size:22px_22px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,transparent_12%,var(--background)_74%)]"
        />
        <PassCard variant="stage" />
        <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
          Drag to pull · click to flip
        </p>
      </div>
    </div>
  );
}
