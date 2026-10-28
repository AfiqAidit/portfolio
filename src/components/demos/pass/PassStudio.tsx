"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { PassCard } from "@/components/shared/PassCard";
import { DemoProjectHeader } from "@/components/shared/DemoProjectHeader";

const PassParticleField = dynamic(
  () => import("./PassParticleField").then((m) => ({ default: m.PassParticleField })),
  { ssr: false },
);

export function PassStudio() {
  const [muted, setMuted] = useState(false);
  const [sandReady, setSandReady] = useState(false);

  useEffect(() => {
    const boot = () => setSandReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const idle = window.requestIdleCallback(boot);
      return () => window.cancelIdleCallback(idle);
    }
    const timer = window.setTimeout(boot, 1);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <DemoProjectHeader
        title="Hanging pass"
        subtitle="Sand follows the cursor. Click a wave. Drag the pass."
        aside={
          <button
            type="button"
            onClick={() => setMuted((off) => !off)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-card hover:text-foreground"
            aria-label={muted ? "Unmute hit sound" : "Mute hit sound"}
            aria-pressed={muted}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        }
      />
      <div className="relative min-h-0 flex-1">
        {sandReady ? <PassParticleField muted={muted} /> : null}
        <PassCard variant="stage" />
        <p className="pointer-events-none absolute inset-x-0 bottom-6 z-10 text-center font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
          Move to sand · click to wave · drag the pass
        </p>
      </div>
    </div>
  );
}
