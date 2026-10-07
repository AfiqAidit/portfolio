"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./clinic-queue.css";

const tabs = [
  { href: "/demos/clinic-queue", label: "Overview", exact: true },
  { href: "/demos/clinic-queue/book", label: "Book" },
  { href: "/demos/clinic-queue/display", label: "Display" },
  { href: "/demos/clinic-queue/staff", label: "Staff" },
];

export function DemoBadge() {
  return (
    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
      Demo, fictional data
    </span>
  );
}

export function ClinicScreenTabs() {
  const pathname = usePathname();
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2 sm:px-4"
      aria-label="Clinic demo screens"
    >
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-card hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
