"use client";

import Link from "next/link";
import { Calendar, Monitor, Stethoscope } from "lucide-react";
import { CLINIC_NAME } from "./constants";
import { DemoBadge } from "./ClinicShell";
import { dispatchClinic } from "./queue-store";
import { useClinicStore } from "./useClinicStore";

const screens = [
  {
    href: "/demos/clinic-queue/book",
    title: "Book appointment",
    desc: "Pick a service and time slot, then track your ticket.",
    icon: Calendar,
  },
  {
    href: "/demos/clinic-queue/display",
    title: "Waiting room display",
    desc: "Large screen view of who is being served in each room.",
    icon: Monitor,
  },
  {
    href: "/demos/clinic-queue/staff",
    title: "Staff console",
    desc: "Check in patients, call next, and manage the queue.",
    icon: Stethoscope,
  },
];

export function OverviewClient() {
  const state = useClinicStore();

  return (
    <div className="clinic-demo-root mx-auto max-w-3xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold text-foreground">{CLINIC_NAME}</h2>
        <DemoBadge />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        A simplified clinic booking and live queue demo. Data stays in your browser. Open Book,
        Display, and Staff in separate tabs to see them update together.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-accent/50"
          onClick={() => dispatchClinic({ type: "loadSample" })}
        >
          Load sample day
        </button>
        <button
          type="button"
          className={`rounded-xl border px-4 py-2 text-sm font-medium ${
            state.autoPlay
              ? "border-accent bg-accent/15 text-accent"
              : "border-border bg-card hover:border-accent/50"
          }`}
          onClick={() => dispatchClinic({ type: "setAutoPlay", on: !state.autoPlay })}
        >
          {state.autoPlay ? "Stop auto-play" : "Auto-play"}
        </button>
        <button
          type="button"
          className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-red-600 hover:border-red-400/50 dark:text-red-400"
          onClick={() => dispatchClinic({ type: "reset" })}
        >
          Reset demo
        </button>
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {screens.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40"
            >
              <s.icon className="h-6 w-6 text-accent" aria-hidden />
              <h3 className="mt-3 font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1 flex-1 text-xs text-muted-foreground">{s.desc}</p>
              <span className="mt-3 text-xs font-medium text-accent">Open screen</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
