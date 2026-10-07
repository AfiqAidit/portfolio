import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClinicDemoLayoutClient } from "@/components/demos/clinic-queue/ClinicDemoLayoutClient";

export default function ClinicQueueLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header
        className="z-50 flex shrink-0 items-center justify-between gap-3 border-b border-border px-3 py-2 sm:px-4"
        style={{ backgroundColor: "var(--nav)" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/#projects"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-accent sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            Portfolio
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
              Clinic queue demo
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              Fictional GP clinic booking and live queue
            </p>
          </div>
        </div>
      </header>
      <ClinicDemoLayoutClient />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
