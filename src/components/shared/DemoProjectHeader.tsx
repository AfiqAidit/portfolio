import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  title: string;
  subtitle?: string;
  /** Optional right-side label (before theme toggle) */
  aside?: ReactNode;
};

export function DemoProjectHeader({ title, subtitle, aside }: Props) {
  return (
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
          <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">{title}</h1>
          {subtitle ? (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {aside}
        <ThemeToggle />
      </div>
    </header>
  );
}
