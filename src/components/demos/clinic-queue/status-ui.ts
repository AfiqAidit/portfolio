import type { TicketStatus } from "./constants";

export const statusLabel: Record<TicketStatus, string> = {
  booked: "Booked",
  waiting: "Waiting",
  called: "Called",
  "in-consultation": "In consultation",
  done: "Done",
  cancelled: "Cancelled",
  "no-show": "No-show",
};

export function statusClass(status: TicketStatus) {
  switch (status) {
    case "waiting":
      return "text-blue-600 dark:text-blue-400";
    case "called":
      return "text-amber-600 dark:text-amber-400";
    case "in-consultation":
      return "text-cyan-600 dark:text-cyan-400";
    case "done":
      return "text-emerald-600 dark:text-emerald-400";
    case "cancelled":
    case "no-show":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}
