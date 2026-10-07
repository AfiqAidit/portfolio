"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Stethoscope, UserRound, Users } from "lucide-react";
import "./clinic-queue.css";

const tabs = [
  { href: "/demos/clinic-queue", label: "Overview", exact: true, icon: LayoutGrid },
  { href: "/demos/clinic-queue/book", label: "Patient", icon: UserRound },
  { href: "/demos/clinic-queue/staff", label: "Staff", icon: Users },
  { href: "/demos/clinic-queue/doctor", label: "Doctor", icon: Stethoscope },
];

export function DemoBadge() {
  return (
    <span
      className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-medium text-sky-800 dark:border-sky-500/35 dark:bg-sky-500/10 dark:text-sky-200"
      title="All names and data in this demo are fictional"
    >
      Demo · fictional data
    </span>
  );
}

export function ClinicScreenTabs() {
  const pathname = usePathname();
  const isDoctor =
    pathname.startsWith("/demos/clinic-queue/doctor") ||
    pathname.startsWith("/demos/clinic-queue/display");

  return (
    <div className="border-b border-border bg-band/80">
      <nav
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6"
        aria-label="Clinic demo roles"
      >
        {tabs.map((tab) => {
          const active =
            tab.label === "Doctor"
              ? isDoctor
              : tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium shadow-sm transition sm:text-sm ${
                active
                  ? "border-accent/50 bg-card text-foreground ring-1 ring-accent/20"
                  : "border-border bg-card/90 text-muted-foreground hover:border-accent/30 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 opacity-80" aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
