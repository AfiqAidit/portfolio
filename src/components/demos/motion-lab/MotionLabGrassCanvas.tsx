"use client";

import { Canvas } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import type { MotionLabPointer } from "@/lib/motion-lab/pointer";
import { MotionLabGrassScene } from "./MotionLabGrassScene";

type Props = {
  count: number;
  pointer: MutableRefObject<MotionLabPointer | null>;
};

export function MotionLabGrassCanvas({ count, pointer }: Props) {
  return (
    <Canvas
      className="absolute inset-0 h-full w-full"
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 3.5, 12.5], fov: 46, near: 0.1, far: 140 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <MotionLabGrassScene count={count} pointer={pointer} />
    </Canvas>
  );
}
