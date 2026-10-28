"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { profile } from "@/content/profile";

/**
 * Hanging badge. Hover does nothing. A click turns the card over where it is.
 * A drag stretches the strap a little, like nylon, then a release springs it
 * back so it can overshoot and swing. The strap cannot be pulled across the page.
 */

const COUNT = 10;
const GRAVITY = 1550;
const DAMP = 0.978;
const FOLLOW = 0.26;
const HOLD = 0.4;
const CLICK_SLOP = 10;
const MIN_LEN = 0.45;
const MAX_STRETCH = 2.7;
const SPRING = 0.14;
const MAX_SWING = 58;
const STRAP_HALF = 11;
const SPIN_DEG = 520;
const MAX_PULL = 0.93;

type Pt = { x: number; y: number; px: number; py: number };

function placeParts(location: string) {
  const [city, ...rest] = location.split(", ");
  return { city, region: rest.join(", ") };
}

function ribbon(points: { x: number; y: number }[], half: number) {
  if (points.length < 2) return "";
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    let tx = next.x - prev.x;
    let ty = next.y - prev.y;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    left.push(`${points[i].x + -ty * half},${points[i].y + tx * half}`);
    right.push(`${points[i].x + ty * half},${points[i].y + -tx * half}`);
  }
  right.reverse();
  return `M ${left[0]} L ${left.slice(1).join(" L ")} L ${right.join(" L ")} Z`;
}

function midline(points: { x: number; y: number }[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

function constrain(a: Pt, b: Pt, rest: number, pinA: boolean, k = 1) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 0.0001;
  const diff = ((len - rest) / len) * k;
  const ox = dx * diff;
  const oy = dy * diff;
  if (pinA) {
    b.x -= ox;
    b.y -= oy;
    return;
  }
  a.x += ox * 0.5;
  a.y += oy * 0.5;
  b.x -= ox * 0.5;
  b.y -= oy * 0.5;
}

function keepAway(p: Pt, ox: number, oy: number, min: number) {
  const dx = p.x - ox;
  const dy = p.y - oy;
  const len = Math.hypot(dx, dy) || 0.0001;
  if (len >= min) return;
  const s = min / len;
  p.x = ox + dx * s;
  p.y = oy + dy * s;
}

function Paper({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-hidden rounded-[1.6rem] border border-black/15 bg-[#f6f5f2] text-[#0a0a0a] backface-hidden ${className}`}
      style={style}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80 [background-image:radial-gradient(rgb(0_0_0/0.05)_0.7px,transparent_0.7px)] [background-size:4px_4px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-black/15"
      />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function Core({ depth }: { depth: number }) {
  const layers = Math.max(6, Math.round(depth));
  return Array.from({ length: layers }, (_, i) => {
    const z = (i / (layers - 1) - 0.5) * depth;
    return (
      <span
        key={i}
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[1.6rem] bg-[#c9c3ba]"
        style={{ transform: `translateZ(${z}px)` }}
      />
    );
  });
}

type PassCardProps = {
  /** Hero hangs on the right of a wide stage. Stage fills a whole demo page. */
  variant?: "hero" | "stage";
};

export function PassCard({ variant = "hero" }: PassCardProps) {
  const uid = useId().replace(/:/g, "");
  const stageRef = useRef<HTMLDivElement>(null);
  const strapRef = useRef<SVGPathElement>(null);
  const edgeRef = useRef<SVGPathElement>(null);
  const stitchRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const shadowRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<SVGGElement>(null);
  const hookRef = useRef<SVGGElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const flipRef = useRef(setFlipped);
  const restFlipRef = useRef(false);

  useEffect(() => {
    flipRef.current = setFlipped;
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    const face = faceRef.current;
    const strap = strapRef.current;
    const edge = edgeRef.current;
    const stitch = stitchRef.current;
    const line = lineRef.current;
    const shadow = shadowRef.current;
    const clip = clipRef.current;
    const hook = hookRef.current;
    const floor = floorRef.current;
    if (!stage || !card || !face || !strap || !edge || !stitch || !line || !shadow || !clip || !hook || !floor) return;
    stage.dataset.ready = "true";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pts: Pt[] = [];
    let rest = 18;
    let ropeLen = rest * (COUNT - 1);
    let hookX = 0;
    let hookY = 20;
    let spawned = false;
    let pressed = false;
    let dragging = false;
    let travel = 0;
    let pointerX = 0;
    let pointerY = 0;
    let offX = 0;
    let offY = 0;
    let grabX = 0;
    let grabY = 0;
    let hang = 0;
    let faceSpin = 0;
    let spinning = false;
    let lastNudge = performance.now();
    let acc = 0;
    let last = performance.now();
    let lastW = 0;
    let lastH = 0;
    let raf = 0;

    const pin = () => {
      const p = pts[0];
      p.x = hookX;
      p.y = hookY;
      p.px = hookX;
      p.py = hookY;
    };

    const layout = (force = false) => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (w < 2 || h < 2) return false;
      const wide = variant === "hero" && w >= 1024;
      hookX = wide ? Math.min(w - 168, w * 0.78) : w / 2;
      hookY = variant === "stage" ? 36 : 22;
      const cardH = card.offsetHeight || 360;
      const drop = Math.min(
        h - cardH - 24,
        Math.max(variant === "stage" ? 200 : 150, (h - cardH) * (wide ? 0.34 : variant === "stage" ? 0.36 : 0.42)),
      );
      const next = drop / (COUNT - 1);
      if (force || !spawned || w !== lastW || h !== lastH) {
        rest = next;
        ropeLen = rest * (COUNT - 1);
        lastW = w;
        lastH = h;
        if (!spawned) {
          for (let i = 0; i < COUNT; i++) {
            const y = hookY + i * rest;
            pts.push({ x: hookX, y, px: hookX, py: y });
          }
          spawned = true;
        } else if (!pressed) {
          for (let i = 0; i < COUNT; i++) {
            const y = hookY + i * rest;
            pts[i].x = hookX;
            pts[i].y = y;
            pts[i].px = hookX;
            pts[i].py = y;
          }
        }
      }
      return true;
    };

    const maxLen = () => {
      const stretch = variant === "stage" ? 3.15 : MAX_STRETCH;
      const reach = Math.hypot(Math.max(80, hookX - 32), Math.max(80, stage.clientHeight - hookY - 48));
      return Math.min(ropeLen * stretch, reach);
    };

    const settleFace = () => {
      const turn = ((faceSpin % 360) + 360) % 360;
      restFlipRef.current = turn > 90 && turn < 270;
      faceSpin = restFlipRef.current ? 180 : 0;
      spinning = false;
      face.style.transition = "transform 700ms ease-out";
      face.style.transform = `rotateY(${faceSpin}deg)`;
      flipRef.current(restFlipRef.current);
    };

    const clampGrab = (x: number, y: number) => {
      const min = ropeLen * MIN_LEN;
      const max = maxLen();
      let dx = x - hookX;
      let dy = y - hookY;
      if (dy < 36) dy = 36;
      const len = Math.hypot(dx, dy) || 0.0001;
      if (len < min) {
        dx *= min / len;
        dy *= min / len;
      } else if (len > max) {
        dx *= max / len;
        dy *= max / len;
      }
      return { x: hookX + dx, y: hookY + dy };
    };

    const draw = () => {
      const end = pts[pts.length - 1];
      const dx = end.x - hookX;
      const dy = Math.max(12, end.y - hookY);
      let target = (Math.atan2(dx, dy) * 180) / Math.PI;
      target = Math.max(-MAX_SWING, Math.min(MAX_SWING, target));
      hang += (target - hang) * (reduced ? 1 : 0.18);
      const cardW = card.offsetWidth || 240;
      const cardH = card.offsetHeight || 360;
      const reach = Math.hypot(dx, dy) / Math.max(ropeLen, 1);
      const pitch = Math.max(-3, Math.min(12, (reach - 1) * 16 + (dragging ? 3 : 0)));
      const yaw = -hang * 0.16;
      card.style.transform = `translate3d(${end.x - cardW / 2}px, ${end.y + 10}px, 0) rotateZ(${hang}deg) rotateX(${pitch}deg) rotateY(${yaw}deg)`;
      const floorX = end.x - 112 + hang * 1.2;
      const floorY = end.y + 10 + cardH + 6;
      floor.style.transform = `translate3d(${floorX}px, ${floorY}px, 0) scale(${0.86 + reach * 0.08}, 0.22)`;
      const floorMul = variant === "stage" ? 0.9 : 0.45;
      floor.style.opacity = String(Math.min(0.28, (0.12 + reach * 0.06) * floorMul));
      const body = ribbon(pts, STRAP_HALF);
      const mid = midline(pts);
      shadow.setAttribute("d", ribbon(pts.map((p) => ({ x: p.x + 3, y: p.y + 5 })), STRAP_HALF));
      strap.setAttribute("d", body);
      edge.setAttribute("d", body);
      stitch.setAttribute("d", mid);
      line.setAttribute("d", mid);
      hook.setAttribute("transform", `translate(${hookX} ${hookY})`);
      clip.setAttribute("transform", `translate(${end.x} ${end.y}) rotate(${hang})`);
      if (spinning) {
        face.style.transition = "none";
        face.style.transform = `rotateY(${faceSpin}deg)`;
      }
    };

    const step = (dt: number, now: number) => {
      if (dragging) {
        const aim = clampGrab(pointerX + offX, pointerY + offY);
        grabX += (aim.x - grabX) * FOLLOW;
        grabY += (aim.y - grabY) * FOLLOW;
      }

      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        let vx = (p.x - p.px) * DAMP;
        let vy = (p.y - p.py) * DAMP;
        const cap = dragging ? 28 : 16;
        const speed = Math.hypot(vx, vy);
        if (speed > cap) {
          vx = (vx / speed) * cap;
          vy = (vy / speed) * cap;
        }
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + GRAVITY * dt * dt;
      }

      const end = pts[pts.length - 1];
      if (dragging) {
        end.x += (grabX - end.x) * HOLD;
        end.y += (grabY - end.y) * HOLD;
        keepAway(end, hookX, hookY, ropeLen * MIN_LEN);
        for (let i = 1; i < pts.length - 1; i++) {
          const t = i / (pts.length - 1);
          pts[i].x = hookX + (end.x - hookX) * t;
          pts[i].y = hookY + (end.y - hookY) * t;
        }
        pin();
        const pull = Math.hypot(end.x - hookX, end.y - hookY);
        const atMax = pull >= maxLen() * MAX_PULL;
        if (atMax && !reduced) {
          if (!spinning) {
            spinning = true;
            faceSpin = restFlipRef.current ? 180 : 0;
          }
          faceSpin += SPIN_DEG * dt;
        } else if (spinning) {
          settleFace();
        }
        return;
      }
      if (spinning) settleFace();

      const ex = end.x - hookX;
      const ey = end.y - hookY;
      const len = Math.hypot(ex, ey) || 0.0001;
      const extra = len - ropeLen;
      end.x -= (ex / len) * extra * SPRING;
      end.y -= (ey / len) * extra * SPRING;

      if (now - lastNudge > 8000) {
        end.px -= (Math.random() < 0.5 ? -1 : 1) * 2.4;
        lastNudge = now;
      }
      pin();
      for (let k = 0; k < 4; k++) {
        for (let i = 0; i < pts.length - 1; i++) constrain(pts[i], pts[i + 1], rest, i === 0, 0.32);
        for (let i = 0; i < pts.length - 2; i++) constrain(pts[i], pts[i + 2], rest * 2, i === 0, 0.18);
        keepAway(end, hookX, hookY, ropeLen * MIN_LEN);
        pin();
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!layout()) return;
      pts[0].x = hookX;
      pts[0].y = hookY;
      if (!reduced && !document.hidden) {
        const dt = Math.min(0.032, (now - last) / 1000);
        last = now;
        acc += dt;
        let n = 0;
        while (acc >= 1 / 60 && n < 3) {
          step(1 / 60, now);
          acc -= 1 / 60;
          n++;
        }
      } else if (reduced) {
        for (let i = 0; i < pts.length; i++) {
          const y = hookY + i * rest;
          pts[i].x = hookX;
          pts[i].y = y;
          pts[i].px = hookX;
          pts[i].py = y;
        }
      }
      draw();
    };

    const local = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      if (reduced) {
        flipRef.current((open) => !open);
        return;
      }
      try {
        face.setPointerCapture(e.pointerId);
      } catch {
        /* window listeners still track the drag */
      }
      const p = local(e);
      const end = pts[pts.length - 1];
      pressed = true;
      dragging = false;
      travel = 0;
      pointerX = p.x;
      pointerY = p.y;
      offX = (end?.x ?? p.x) - p.x;
      offY = (end?.y ?? p.y) - p.y;
      grabX = end?.x ?? p.x;
      grabY = end?.y ?? p.y;
      setGrabbing(true);
    };
    const onMove = (e: PointerEvent) => {
      if (!pressed) return;
      const p = local(e);
      travel += Math.hypot(p.x - pointerX, p.y - pointerY);
      pointerX = p.x;
      pointerY = p.y;
      if (!dragging && travel > CLICK_SLOP) dragging = true;
    };
    const onUp = () => {
      if (!pressed) return;
      pressed = false;
      setGrabbing(false);
      const end = pts[pts.length - 1];
      if (!end) return;
      if (!dragging) {
        end.px = end.x;
        end.py = end.y;
        restFlipRef.current = !restFlipRef.current;
        faceSpin = restFlipRef.current ? 180 : 0;
        face.style.transition = "transform 700ms ease-out";
        face.style.transform = `rotateY(${faceSpin}deg)`;
        flipRef.current(restFlipRef.current);
        return;
      }
      if (spinning) settleFace();
      dragging = false;
      const ex = end.x - hookX;
      const ey = end.y - hookY;
      const len = Math.hypot(ex, ey) || 1;
      const extra = Math.max(0, len - ropeLen);
      const snap = Math.min(22, 4 + extra * 0.18);
      end.px = end.x + (ex / len) * snap;
      end.py = end.y + (ey / len) * snap;
      for (let i = 1; i < pts.length - 1; i++) {
        const t = i / (pts.length - 1);
        pts[i].px = pts[i].x + (ex / len) * snap * t;
        pts[i].py = pts[i].y + (ey / len) * snap * t;
      }
    };

    face.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    layout(true);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      face.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [variant]);

  const { city, region } = placeParts(profile.location);
  const since = profile.stats[0]?.value ?? "";
  const strapCopy = `${profile.shortName.toUpperCase()}  ·  ${profile.title.toUpperCase()}  ·  `;
  const weave = `weave-${uid}`;
  const pathId = `strap-line-${uid}`;
  const depth = variant === "stage" ? 10 : 8;
  const faceZ = depth / 2 + 0.4;

  return (
    <div
      ref={stageRef}
      className={`pointer-events-none absolute inset-0 overflow-visible [perspective-origin:50%_8%] [&:not([data-ready])]:invisible ${variant === "stage" ? "[perspective:900px]" : "[perspective:1200px]"}`}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <pattern id={weave} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
            <rect width="5" height="5" fill="#2c3138" />
            <path d="M0 0H5" stroke="#3c434c" strokeWidth="1.1" />
          </pattern>
        </defs>
        <path ref={shadowRef} fill="#000" opacity="0.22" />
        <path ref={strapRef} fill={`url(#${weave})`} />
        <path ref={edgeRef} fill="none" stroke="#1b1e23" strokeWidth="1.25" />
        <path ref={stitchRef} fill="none" stroke="#8b939c" strokeWidth="1.1" strokeDasharray="2.5 3.5" />
        <path ref={lineRef} id={pathId} fill="none" />
        <text fill="#d7dbe0" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" letterSpacing="1.6">
          <textPath href={`#${pathId}`} startOffset="8%">
            {strapCopy}
            {strapCopy}
          </textPath>
        </text>
        <g ref={hookRef}>
          <rect x="-9" y="-7" width="18" height="10" rx="2" fill="#9aa0a6" stroke="#6d737a" strokeWidth="1" />
          <rect x="-6" y="-3" width="12" height="8" rx="1.5" fill="#7d848c" />
        </g>
        <g ref={clipRef}>
          <rect x="-8" y="-14" width="16" height="20" rx="2.5" fill="#9aa0a6" stroke="#6d737a" strokeWidth="1" />
          <rect x="-5" y="-8" width="10" height="10" rx="1.5" fill="#6f757c" />
          <rect x="-11" y="6" width="22" height="5" rx="1.5" fill="#b4bac0" />
        </g>
      </svg>
      <div
        ref={floorRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 h-20 w-52 rounded-[100%] bg-black/25 blur-2xl"
      />
      <div
        ref={cardRef}
        className={`pointer-events-auto absolute top-0 left-0 [transform-style:preserve-3d] ${variant === "stage" ? "w-[280px] sm:w-[320px]" : "w-[240px] sm:w-[260px]"}`}
        style={{ transformOrigin: "center -8px" }}
      >
        <div
          ref={faceRef}
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label="Hanging badge. Drag to swing it. Click to turn it over."
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            restFlipRef.current = !restFlipRef.current;
            const next = restFlipRef.current;
            setFlipped(next);
            const node = faceRef.current;
            if (!node) return;
            node.style.transition = "transform 700ms ease-out";
            node.style.transform = `rotateY(${next ? 180 : 0}deg)`;
          }}
          className={`aspect-[5/7] w-full touch-none [transform-style:preserve-3d] select-none motion-reduce:transition-none ${grabbing ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ transform: "rotateY(0deg)" }}
        >
          <Core depth={depth} />
          <Paper className="shadow-[inset_0_1px_0_rgb(255_255_255/0.45)]" style={{ transform: `translateZ(${faceZ}px)` }}>
            <span aria-hidden className="mx-auto mt-4 h-2.5 w-12 rounded-full bg-black/15" />
            <div className="flex items-start justify-between gap-3 px-5 pt-3 font-mono text-[10px] tracking-[0.16em] text-neutral-500 uppercase">
              <span>Engineer</span>
              <span>{since}</span>
            </div>
            <div className="relative mx-5 mt-3 min-h-0 flex-1 overflow-hidden rounded-[1.1rem] bg-[#e4dfd6] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]">
              {profile.cardPhoto ? (
                <img
                  src={profile.cardPhoto}
                  alt=""
                  draggable={false}
                  className="pointer-events-none h-full w-full object-cover object-[center_42%]"
                />
              ) : null}
            </div>
            <div className="px-5 pt-3 pb-5">
              <p className="text-[1.55rem] leading-none font-semibold tracking-tight">{profile.shortName}</p>
              <p className="mt-1.5 text-sm text-neutral-600">{profile.title}</p>
              <div className="mt-3 h-px bg-black/10" />
              <div className="mt-2.5 flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.14em] text-neutral-500 uppercase">
                <span>{city}</span>
                {region ? <span>{region}</span> : null}
              </div>
            </div>
          </Paper>
          <Paper style={{ transform: `rotateY(180deg) translateZ(${faceZ}px)` }}>
            <div className="flex h-full flex-col justify-between px-6 py-7">
              <p className="font-mono text-[10px] tracking-[0.18em] text-neutral-500 uppercase">
                {profile.cardNote.kicker}
              </p>
              <div>
                <p className="text-[2rem] leading-none font-semibold tracking-tight">{profile.cardNote.title}</p>
                <p className="mt-4 text-sm leading-relaxed text-neutral-600">{profile.cardNote.body}</p>
              </div>
              <p className="font-mono text-[10px] tracking-[0.16em] text-neutral-500 uppercase">
                {profile.coordinates}
              </p>
            </div>
          </Paper>
        </div>
      </div>
    </div>
  );
}
