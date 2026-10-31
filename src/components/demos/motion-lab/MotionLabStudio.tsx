"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { profile } from "@/content/profile";
import { createMotionLabAudio, type MotionLabAudio } from "@/lib/motion-lab/ambience";
import { fluidQuality } from "@/lib/motion-lab/fluid-sim";
import type { MotionLabPointer } from "@/lib/motion-lab/pointer";
import { MotionLabFluidCanvas } from "./MotionLabFluidCanvas";
import { MotionLabSoundControl } from "./MotionLabSoundControl";
import "./motion-lab.css";

const MotionLabGrassCanvas = dynamic(
  () => import("./MotionLabGrassCanvas").then((m) => ({ default: m.MotionLabGrassCanvas })),
  { ssr: false },
);

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export function MotionLabStudio() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioRef = useRef<MotionLabAudio | null>(null);
  const mutedRef = useRef(false);
  const userMutedRef = useRef(false);
  const pointerRef = useRef<MotionLabPointer | null>(null);
  const lastMoveRef = useRef<{ x: number; y: number } | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const grassCount = fluidQuality().grass;

  useEffect(() => {
    const boot = () => setReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(boot);
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(boot, 1);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reduced) {
      mutedRef.current = true;
      setMuted(true);
      return;
    }
    const audio = createMotionLabAudio();
    if (!audio) return;
    audioRef.current = audio;
    setAnalyser(audio.analyser);
    void audio.enable().then((playing) => {
      if (playing || userMutedRef.current) return;
      mutedRef.current = true;
      setMuted(true);
    });
    return () => {
      audio.dispose();
      audioRef.current = null;
      setAnalyser(null);
    };
  }, [reduced]);

  const onToggleSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !mutedRef.current;
    mutedRef.current = next;
    userMutedRef.current = next;
    setMuted(next);
    if (next) audio.disable();
    else void audio.enable();
  }, []);

  const onPointerDown = useCallback(() => {
    if (userMutedRef.current) return;
    void audioRef.current?.enable().then((playing) => {
      if (!playing) return;
      mutedRef.current = false;
      setMuted(false);
    });
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = fieldRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    const prev = lastMoveRef.current;
    lastMoveRef.current = { x, y };
    const dx = prev ? x - prev.x : 0;
    const dy = prev ? y - prev.y : 0;
    pointerRef.current = { x, y, vx: dx, vy: dy };

    el.dispatchEvent(
      new CustomEvent("motion-lab-pointer", {
        detail: { x, y, dx, dy },
      }),
    );
  }, []);

  return (
    <div className="motion-lab-root relative h-dvh w-full overflow-hidden bg-[#0b1f12]">
      <div
        ref={fieldRef}
        className="absolute inset-0 touch-none"
        onPointerDown={reduced ? undefined : onPointerDown}
        onPointerMove={reduced ? undefined : onPointerMove}
      >
        {reduced ? (
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#2d5a3a] via-[#0f2415] to-[#071208]"
            aria-hidden
          />
        ) : ready ? (
          <>
            <MotionLabFluidCanvas active />
            <MotionLabGrassCanvas count={grassCount} pointer={pointerRef} />
          </>
        ) : (
          <div className="absolute inset-0 animate-pulse bg-[#143622]" aria-hidden />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#051008]/75 via-transparent to-transparent" />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-6">
        <Link
          href="/#projects"
          className="motion-lab-glass pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-white/90 transition hover:bg-white/10 sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Portfolio
        </Link>
        <div className="flex items-center gap-2">
          <MotionLabSoundControl
            muted={muted}
            active={!reduced && analyser !== null}
            analyser={analyser}
            onToggle={onToggleSound}
          />
          <p className="motion-lab-glass hidden rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-white/90 uppercase sm:block">
            Green field
          </p>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-6 pb-10 sm:p-10">
        <p className="font-mono text-[10px] tracking-[0.22em] text-white/55 uppercase">
The streak follows the cursor. Grass leans for a few seconds, then stands back up.
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl leading-[1.05] font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {profile.shortName}&apos;s{" "}
          <span className="bg-gradient-to-r from-[#c8f090] to-[#3d8b45] bg-clip-text text-transparent">
            motion lab
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
          A WebGL field at golden hour: rolling hills, a pond, and a small kampung house. Your cursor is a gust; the faster you move, the stronger it blows.
        </p>
        {reduced ? (
          <p className="mt-4 text-xs text-white/50">
            Reduced motion is on. Effects are paused; content stays readable.
          </p>
        ) : null}
      </div>
    </div>
  );
}
