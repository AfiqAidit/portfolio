"use client";

import type { PointerEvent, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "article";
};

export function trackPointer(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--x", `${e.clientX - rect.left}px`);
  el.style.setProperty("--y", `${e.clientY - rect.top}px`);
}

/** Card whose border and surface glow follow the mouse (hover devices only). */
export function Spotlight({ children, className = "", as: Tag = "div" }: Props) {
  return (
    <Tag onPointerMove={trackPointer} className={`spotlight ${className}`}>
      {children}
    </Tag>
  );
}
