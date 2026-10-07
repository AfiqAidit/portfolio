"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Stethoscope, UserRound, Users } from "lucide-react";
import "./clinic-queue.css";
import { CLINIC_NAME, ROOMS } from "./constants";

const ROLE_TABS = [
  { label: "Patient", icon: UserRound },
  { label: "Staff", icon: Users },
  { label: "Doctor", icon: Stethoscope, active: true },
] as const;

const FRAMES = [
  {
    rooms: [{ n: "A014" }, { n: "A012" }],
    next: ["A015", "W003", "A016"],
    staff: [
      { name: "Alex Tan", meta: "09:30 · Booked" },
      { name: "Siti Rahman", meta: "10:00 · Booked" },
    ],
  },
  {
    rooms: [{ n: "W003" }, { n: "A012" }],
    next: ["A016", "A017", "W004"],
    staff: [
      { name: "Siti Rahman", meta: "Checked in · Waiting" },
      { name: "Jamal Demo", meta: "Walk-in · Waiting" },
    ],
  },
] as const;

export function ClinicQueueCardPreview() {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setFrame((n) => (n + 1) % FRAMES.length), 3200);
    return () => clearInterval(id);
  }, [reduced]);

  const data = FRAMES[reduced ? 0 : frame];

  return (
    <Link
      href="/demos/clinic-queue"
      className="group/preview relative block aspect-[16/10] w-full overflow-hidden border-b border-border bg-background/30"
    >
      <div
        className="clinic-demo-root absolute inset-0 bg-gradient-to-br from-sky-500/20 via-background to-cyan-500/10"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(14 165 233 / 0.35) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />

        <div className="relative flex h-full flex-col p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-1">
            {ROLE_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = "active" in tab && tab.active;
              return (
                <span
                  key={tab.label}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[9px] font-medium shadow-sm sm:text-[10px] ${
                    active
                      ? "border-accent/50 bg-card text-foreground ring-1 ring-accent/25"
                      : "border-border/80 bg-card/70 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-2.5 w-2.5 opacity-80" />
                  {tab.label}
                </span>
              );
            })}
          </div>

          <div className="mt-2 flex min-h-0 flex-1 gap-2">
            <div className="flex min-w-0 flex-[1.15] flex-col rounded-xl border border-border/80 bg-card/95 p-2 shadow-sm backdrop-blur-sm sm:p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[8px] text-accent sm:text-[9px]">Waiting room</p>
                  <p className="text-[10px] font-semibold leading-tight text-foreground sm:text-xs">
                    {CLINIC_NAME}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-medium text-emerald-700 dark:text-emerald-300">
                  Live
                </span>
              </div>

              <div className="mt-2 grid flex-1 grid-cols-2 gap-1.5">
                {ROOMS.map((room, ri) => {
                  const num = data.rooms[ri]?.n ?? "—";
                  return (
                    <div
                      key={room.id}
                      className="rounded-lg border border-border bg-background/70 p-1.5 sm:p-2"
                    >
                      <p className="truncate text-[8px] text-muted-foreground sm:text-[9px]">
                        {room.label} · {room.doctor}
                      </p>
                      <p className="mt-1 text-[7px] font-medium uppercase tracking-wide text-muted-foreground">
                        Now serving
                      </p>
                      <motion.p
                        key={`${frame}-${room.id}-${num}`}
                        initial={reduced ? false : { opacity: 0.4, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="font-mono text-lg font-bold tabular-nums leading-none text-foreground sm:text-xl"
                      >
                        {num}
                      </motion.p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2">
                <p className="text-[7px] font-medium uppercase tracking-wide text-muted-foreground">
                  Next
                </p>
                <ul className="mt-1 flex flex-wrap gap-1">
                  {data.next.map((n, i) => (
                    <li
                      key={n}
                      className={`rounded-md border font-mono tabular-nums ${
                        i === 0
                          ? "border-accent/50 bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-foreground"
                          : "border-border bg-background/80 px-1 py-0.5 text-[9px] text-muted-foreground"
                      }`}
                    >
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-border/80 bg-card/90 p-2 shadow-sm backdrop-blur-sm sm:p-2.5">
              <p className="font-mono text-[8px] text-accent sm:text-[9px]">Front desk</p>
              <p className="text-[10px] font-semibold text-foreground sm:text-xs">Online arrivals</p>
              <ul className="mt-2 flex flex-1 flex-col gap-1.5">
                {data.staff.map((row) => (
                  <li
                    key={row.name}
                    className="rounded-lg border border-border bg-background/60 px-2 py-1.5"
                  >
                    <p className="truncate text-[9px] font-medium text-foreground sm:text-[10px]">
                      {row.name}
                    </p>
                    <p className="truncate text-[8px] text-muted-foreground">{row.meta}</p>
                    <span
                      className="mt-1 inline-block rounded-md bg-accent/90 px-1.5 py-0.5 text-[8px] font-medium text-accent-foreground"
                    >
                      Check in
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 transition-opacity group-hover/preview:opacity-100"
          aria-hidden
        />
      </div>

      <span className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-border bg-card/95 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
        Open full demo
      </span>
    </Link>
  );
}
