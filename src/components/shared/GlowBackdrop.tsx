"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** "top" puts the glows like the hero; "bottom" mirrors them for the closing section. */
  placement?: "top" | "bottom";
};

/**
 * Decorative dot grid + drifting glows that light up around the cursor.
 * The parent must be `relative overflow-hidden group`.
 */
export function GlowBackdrop({ placement = "top" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    const host = layer?.parentElement;
    if (!layer || !host) return;
    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      layer.style.setProperty("--x", `${e.clientX - rect.left}px`);
      layer.style.setProperty("--y", `${e.clientY - rect.top}px`);
    };
    host.addEventListener("pointermove", onMove);
    return () => host.removeEventListener("pointermove", onMove);
  }, []);

  const bottom = placement === "bottom";

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="bg-dot-grid absolute inset-0"
        style={bottom ? { maskImage: "radial-gradient(ellipse 80% 70% at 50% 70%, #000 40%, transparent 100%)" } : undefined}
      />
      <div className="hero-cursor-glow absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="bg-dot-grid-lit absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div
        className={`animate-drift absolute h-[32rem] w-[32rem] rounded-full bg-accent/20 blur-3xl ${
          bottom ? "-bottom-40 -right-32" : "-left-32 -top-40"
        }`}
      />
      <div
        className={`animate-drift-slow absolute h-[30rem] w-[30rem] rounded-full bg-accent-2/15 blur-3xl ${
          bottom ? "-left-40 -top-48" : "-bottom-48 -right-40"
        }`}
      />
    </div>
  );
}
