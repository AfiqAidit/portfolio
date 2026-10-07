"use client";

import Link from "next/link";
import { Stethoscope, UserRound, Users } from "lucide-react";
import { Spotlight } from "@/components/shared/Spotlight";
import { ClinicRoleChrome } from "./ClinicRoleChrome";
import { LiveQueueStrip } from "./LiveQueueStrip";
import { dispatchClinic } from "./queue-store";
import { useClinicStore } from "./useClinicStore";

const roles = [
  {
    href: "/demos/clinic-queue/book",
    title: "Patient",
    desc: "Book a slot online and watch your queue position update live.",
    icon: UserRound,
    accent: "from-sky-500/20 to-cyan-500/5",
    cta: "Open patient view",
    newTab: false,
  },
  {
    href: "/demos/clinic-queue/staff",
    title: "Staff",
    desc: "Check in bookings and add walk-ins at the front desk.",
    icon: Users,
    accent: "from-slate-500/15 to-zinc-500/5",
    cta: "Open staff console",
    newTab: true,
  },
  {
    href: "/demos/clinic-queue/doctor",
    title: "Doctor",
    desc: "Call the next patient, finish visits, and run the waiting room board.",
    icon: Stethoscope,
    accent: "from-cyan-500/20 to-teal-500/5",
    cta: "Open doctor view",
    newTab: true,
  },
];

export function OverviewClient() {
  const state = useClinicStore();

  return (
    <ClinicRoleChrome role="overview" wide>
      <LiveQueueStrip />

      <div className="mt-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <p className="font-mono text-xs text-accent">Try the demo</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:border-accent/40"
            onClick={() => dispatchClinic({ type: "loadSample" })}
          >
            Load sample day
          </button>
          <button
            type="button"
            className={`rounded-xl border px-4 py-2 text-sm font-medium shadow-sm ${
              state.autoPlay
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-background hover:border-accent/40"
            }`}
            onClick={() => dispatchClinic({ type: "setAutoPlay", on: !state.autoPlay })}
          >
            {state.autoPlay ? "Stop auto-play" : "Auto-play"}
          </button>
          <button
            type="button"
            className="rounded-xl border border-red-400/40 bg-background px-4 py-2 text-sm font-medium text-red-600 shadow-sm dark:text-red-400"
            onClick={() => dispatchClinic({ type: "reset" })}
          >
            Reset demo
          </button>
        </div>
        <ul className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          <li>
            <strong className="font-medium text-foreground">Load sample day</strong> fills today with
            about a dozen fake bookings, some already checked in, plus walk-ins, so Staff and Doctor
            have data without you clicking through booking.
          </li>
          <li>
            <strong className="font-medium text-foreground">Auto-play</strong> runs the clinic every
            few seconds (check-in, call next, finish visit) so the live strip and Doctor board move on
            their own. Stops when you turn it off, reset, or hide the tab.
          </li>
        </ul>
      </div>

      <p className="mt-8 font-mono text-xs text-accent">Roles</p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
        Three screens, one queue
      </h3>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Open Staff and Doctor in separate tabs to see the same queue update in real time.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {roles.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              target={r.newTab ? "_blank" : undefined}
              rel={r.newTab ? "noopener noreferrer" : undefined}
              className="block h-full"
            >
              <Spotlight
                as="article"
                className={`h-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${r.accent} p-6 transition hover:border-accent/40`}
              >
                <r.icon className="h-7 w-7 text-accent" aria-hidden />
                <h4 className="mt-4 text-lg font-semibold text-foreground">{r.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
                <span className="mt-4 inline-block text-sm font-medium text-accent">{r.cta}</span>
              </Spotlight>
            </Link>
          </li>
        ))}
      </ul>
    </ClinicRoleChrome>
  );
}
