"use client";

import type { ReactNode } from "react";
import { DemoBadge } from "./ClinicShell";
import { ROLE_CONFIG, type ClinicRole } from "./role-config";

type Props = {
  role: ClinicRole;
  children: ReactNode;
  /** Wider canvas for doctor TV layout */
  wide?: boolean;
};

export function ClinicRoleChrome({ role, children, wide }: Props) {
  const c = ROLE_CONFIG[role];
  const Icon = c.icon;

  return (
    <div className="clinic-demo-root flex min-h-0 flex-1 flex-col bg-background">
      <div className={`border-b border-border bg-gradient-to-br ${c.gradient}`}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card/90 shadow-sm">
                <Icon className="h-6 w-6 text-accent" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs text-accent">{c.index}</p>
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {c.title}
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {c.subtitle}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <DemoBadge />
            </div>
          </div>
        </div>
      </div>
      <div
        className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 ${wide ? "max-w-6xl" : "max-w-3xl"}`}
      >
        {children}
      </div>
    </div>
  );
}
