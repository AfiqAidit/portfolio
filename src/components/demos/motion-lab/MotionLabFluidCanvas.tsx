"use client";

import { useEffect, useRef } from "react";
import { createFluidSimulation, fluidQuality, type FluidSimulation } from "@/lib/motion-lab/fluid-sim";

type PointerDetail = {
  x: number;
  y: number;
  dx: number;
  dy: number;
};

type Props = {
  active: boolean;
};

/** Soft golden pollen in the air, not the main focus of the scene. */
const POLLEN: [number, number, number] = [0.72, 0.92, 0.45];

export function MotionLabFluidCanvas({ active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const q = fluidQuality();
    const sim = createFluidSimulation(canvas, q.sim, q.dye);
    if (!sim) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = host.clientWidth;
      const h = host.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      sim.resize(canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const onPointer = (event: Event) => {
      const { x, y, dx, dy } = (event as CustomEvent<PointerDetail>).detail;
      const speed = Math.hypot(dx, dy);
      const bursts = Math.max(1, Math.min(5, Math.ceil(speed * 120)));
      for (let i = 0; i < bursts; i++) {
        sim.pushSplat({
          x: x + (Math.random() - 0.5) * 0.002,
          y: y + (Math.random() - 0.5) * 0.002,
          dx: dx * (1 + i * 0.15),
          dy: dy * (1 + i * 0.15),
          color: POLLEN,
        });
      }
    };

    host.addEventListener("motion-lab-pointer", onPointer);

    let last = performance.now();
    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.022);
      last = now;
      if (sim.step(dt)) sim.draw();
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      host.removeEventListener("motion-lab-pointer", onPointer);
      sim.destroy();
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35] mix-blend-soft-light"
      aria-hidden
    />
  );
}
