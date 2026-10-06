"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { styleVariants } from "@/content/profile";

function activeSlug(pathname: string): (typeof styleVariants)[number]["slug"] {
  if (pathname.startsWith("/style/classic")) return "classic";
  if (pathname.startsWith("/style/bento")) return "bento";
  if (pathname.startsWith("/style/motion") || pathname === "/") return "motion";
  return "motion";
}

export function LayoutStyleSwitcher() {
  const pathname = usePathname();
  const active = activeSlug(pathname);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2 sm:px-6">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Layout</span>
      <div
        className="inline-flex rounded-full border border-border p-0.5"
        role="tablist"
        aria-label="Portfolio layout style"
      >
        {styleVariants.map((v) => {
          const href = v.slug === "motion" ? "/" : v.href;
          const isActive = active === v.slug;
          return (
            <Link
              key={v.slug}
              href={href}
              role="tab"
              aria-selected={isActive}
              className={`rounded-full px-3 py-1 text-xs font-medium transition sm:px-3.5 sm:text-sm ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
