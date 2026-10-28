"use client";

import { useEffect, useRef } from "react";

/**
 * /demos/pass only. Move leaves a sand trail that dies after a few seconds.
 * Click sends a ring through the page; dots fade as the ring passes.
 */

const TRAIL_SPREAD = 150;
const TRAIL_SPAWN = 42;
const TRAIL_LIFE = 2.6;
const FIELD_GAP = 10;
const FIELD_SPRING = 0.14;
const FIELD_DAMP = 0.8;
const WAVE_SPEED = 520;
const WAVE_WIDTH = 62;
const WAVE_AMP = 32;
const WAVE_DOT = 2.5;
const GLOW_DECAY = 0.82;

type Grain = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
};

type Dot = {
  restX: number;
  restY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  glow: number;
};

type Wave = { x: number; y: number; born: number };

function readInk(node: HTMLElement) {
  return getComputedStyle(node).getPropertyValue("--foreground").trim() || "#0a0a0a";
}

function buzz() {
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate([24, 30, 40]);
  } catch {
    /* desktop browsers often expose vibrate and then reject it */
  }
}

function playHit(audio: AudioContext) {
  const t = audio.currentTime;
  const thump = audio.createOscillator();
  const thumpGain = audio.createGain();
  thump.type = "sine";
  thump.frequency.setValueAtTime(170, t);
  thump.frequency.exponentialRampToValueAtTime(52, t + 0.16);
  thumpGain.gain.setValueAtTime(0.18, t);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  thump.connect(thumpGain);
  thumpGain.connect(audio.destination);
  thump.start(t);
  thump.stop(t + 0.22);

  const count = Math.floor(audio.sampleRate * 0.12);
  const buffer = audio.createBuffer(1, count, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < count; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audio.sampleRate * 0.028));
  }
  const noise = audio.createBufferSource();
  const noiseGain = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 720;
  noise.buffer = buffer;
  noiseGain.gain.setValueAtTime(0.12, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audio.destination);
  noise.start(t);
}

function spawnField(width: number, height: number): Dot[] {
  const next: Dot[] = [];
  const gap = Math.min(width, height) < 700 ? 14 : FIELD_GAP;
  const jitter = gap * 0.3;
  for (let y = gap; y < height; y += gap) {
    for (let x = gap; x < width; x += gap) {
      if (Math.random() > 0.88) continue;
      const px = x + (Math.random() - 0.5) * jitter;
      const py = y + (Math.random() - 0.5) * jitter;
      next.push({ restX: px, restY: py, x: px, y: py, vx: 0, vy: 0, glow: 0 });
    }
  }
  return next;
}

function spray(grains: Grain[], x: number, y: number) {
  for (let i = 0; i < TRAIL_SPAWN; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * TRAIL_SPREAD;
    grains.push({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      life: TRAIL_LIFE * (0.7 + Math.random() * 0.3),
      maxLife: TRAIL_LIFE,
      size: 1 + Math.random() * 1.2,
    });
  }
}

export function PassParticleField({ muted }: { muted: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const AudioKit = window.AudioContext || window.webkitAudioContext;
    let audio: AudioContext | null = null;
    const grains: Grain[] = [];
    let field: Dot[] = [];
    let waves: Wave[] = [];
    let lit = 0;
    let last = performance.now();
    let lastSpawn = 0;
    let raf = 0;
    let running = false;
    let width = 0;
    let height = 0;

    const ensureAudio = () => {
      if (!AudioKit) return null;
      if (!audio) audio = new AudioKit();
      if (audio.state === "suspended") void audio.resume();
      return audio;
    };

    const fit = () => {
      const nextW = parent.clientWidth;
      const nextH = parent.clientHeight;
      const ratio = Math.min(1.5, window.devicePixelRatio || 1);
      width = nextW;
      height = nextH;
      canvas.width = Math.floor(nextW * ratio);
      canvas.height = Math.floor(nextH * ratio);
      canvas.style.width = `${nextW}px`;
      canvas.style.height = `${nextH}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (field.length) field = spawnField(nextW, nextH);
    };

    const ensureField = () => {
      if (!field.length) field = spawnField(width, height);
    };

    const ensureLoop = () => {
      if (running || document.hidden || reduced) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stepField = (now: number) => {
      lit = 0;
      for (const p of field) {
        for (const wave of waves) {
          const dist = Math.hypot(p.restX - wave.x, p.restY - wave.y);
          const radius = ((now - wave.born) / 1000) * WAVE_SPEED;
          const band = Math.abs(dist - radius);
          if (band >= WAVE_WIDTH || dist < 0.5) continue;
          const falloff = 0.5 + 0.5 * Math.cos((band / WAVE_WIDTH) * Math.PI);
          p.glow = Math.max(p.glow, falloff);
          p.vx += ((p.restX - wave.x) / dist) * WAVE_AMP * falloff;
          p.vy += ((p.restY - wave.y) / dist) * WAVE_AMP * falloff;
        }
        p.glow *= GLOW_DECAY;
        if (p.glow < 0.02) p.glow = 0;
        if (p.glow > 0) lit += 1;
        p.vx += (p.restX - p.x) * FIELD_SPRING;
        p.vy += (p.restY - p.y) * FIELD_SPRING;
        p.vx *= FIELD_DAMP;
        p.vy *= FIELD_DAMP;
        p.x += p.vx;
        p.y += p.vy;
      }
      waves = waves.filter((wave) => now - wave.born < 2800);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, width, height);
      if (reduced) {
        running = false;
        return;
      }
      ctx.fillStyle = readInk(parent);
      if (waves.length > 0 || lit > 0) {
        stepField(now);
        for (const p of field) {
          if (p.glow <= 0) continue;
          ctx.globalAlpha = 0.72 * p.glow;
          ctx.fillRect(p.x, p.y, WAVE_DOT, WAVE_DOT);
        }
      }
      for (let i = grains.length - 1; i >= 0; i--) {
        const g = grains[i];
        g.life -= dt;
        if (g.life <= 0) {
          grains.splice(i, 1);
          continue;
        }
        g.vx *= 0.97;
        g.vy *= 0.97;
        g.x += g.vx;
        g.y += g.vy;
        ctx.globalAlpha = 0.58 * (g.life / g.maxLife);
        ctx.fillRect(g.x, g.y, g.size, g.size);
      }
      ctx.globalAlpha = 1;
      if (grains.length > 0 || waves.length > 0 || lit > 0) {
        raf = requestAnimationFrame(frame);
        return;
      }
      running = false;
    };

    const local = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    };

    const onMove = (e: PointerEvent) => {
      if (reduced) return;
      const now = performance.now();
      if (now - lastSpawn < 16) return;
      lastSpawn = now;
      spray(grains, local(e).x, local(e).y);
      if (grains.length > 2800) grains.splice(0, grains.length - 2800);
      ensureLoop();
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || reduced) return;
      const p = local(e);
      ensureField();
      waves.push({ x: p.x, y: p.y, born: performance.now() });
      ensureLoop();
      buzz();
      if (!mutedRef.current) {
        const kit = ensureAudio();
        if (kit) playHit(kit);
      }
    };

    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    fit();
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        running = false;
        return;
      }
      if (grains.length || waves.length || lit) ensureLoop();
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVisibility);
      void audio?.close();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 h-full w-full cursor-crosshair touch-none"
      aria-hidden
    />
  );
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
