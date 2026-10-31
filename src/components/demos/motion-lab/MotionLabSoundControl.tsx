"use client";

import { useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

type Props = {
  muted: boolean;
  active: boolean;
  analyser: AnalyserNode | null;
  onToggle: () => void;
};

export function MotionLabSoundControl({ muted, active, analyser, onToggle }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playing = !muted && active && analyser !== null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !playing || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = 58;
    const h = 28;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = "29px";
    canvas.style.height = "14px";
    ctx.scale(dpr, dpr);

    const bars = 5;
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      analyser.getByteFrequencyData(data);
      for (let i = 0; i < bars; i++) {
        const sample = data[i + 1] / 255;
        const bh = 3 + sample * (h - 4);
        ctx.fillStyle = `rgba(214, 245, 170, ${0.7 + sample * 0.3})`;
        ctx.fillRect(4 + i * 10, h - bh - 2, 3, bh);
      }
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [playing, analyser]);

  return (
    <button
      type="button"
      onClick={onToggle}
      className="motion-lab-glass pointer-events-auto relative block h-9 w-12 rounded-full text-white/90 transition hover:bg-white/10"
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      aria-pressed={!muted}
    >
      {playing ? (
        <canvas ref={canvasRef} className="absolute inset-0 m-auto block" aria-hidden />
      ) : muted ? (
        <VolumeX className="absolute inset-0 m-auto h-4 w-4" aria-hidden />
      ) : (
        <Volume2 className="absolute inset-0 m-auto h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
