import { Check } from "lucide-react";

const STEPS = ["Clinic", "Service", "Slot", "Details"] as const;

type Props = {
  current: number;
};

const CIRCLE_CENTER = "mt-4"; // half of h-8, lines meet circle midline

export function BookingStepper({ current }: Props) {
  return (
    <nav aria-label="Booking progress" className="mb-6">
      <ol className="flex w-full items-start">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = current > n;
          const active = current === n;
          const segmentDone = current > n;

          return (
            <li
              key={label}
              className={`flex items-start ${i < STEPS.length - 1 ? "flex-1" : "shrink-0"}`}
              aria-current={active ? "step" : undefined}
            >
              <div className="flex w-8 shrink-0 flex-col items-center gap-1.5 sm:w-auto sm:min-w-[3.5rem]">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${
                    active
                      ? "border-accent bg-accent text-accent-foreground"
                      : done
                        ? "border-accent/50 bg-accent/15 text-accent"
                        : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden /> : n}
                </span>
                <span
                  className={`max-w-[4.5rem] text-center text-[10px] font-medium leading-tight sm:max-w-none sm:text-xs ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 ? (
                <div
                  className={`${CIRCLE_CENTER} h-0.5 min-w-[0.5rem] flex-1 ${segmentDone ? "bg-accent/60" : "bg-border"}`}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
