/** Shared pill / segment button styles for the clinic demo */
export function segmentBtn(active: boolean) {
  return `rounded-xl border px-3 py-1.5 text-xs font-medium shadow-sm transition sm:px-4 sm:py-2 sm:text-sm ${
    active
      ? "border-accent bg-accent text-accent-foreground"
      : "border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground"
  }`;
}

export function choiceCard(active: boolean) {
  return `w-full rounded-2xl border px-4 py-4 text-left shadow-sm transition hover:border-accent/50 hover:bg-[var(--clinic-surface)] ${
    active
      ? "border-accent bg-accent/15 ring-1 ring-accent/25"
      : "border-border bg-[var(--clinic-surface)]"
  }`;
}
