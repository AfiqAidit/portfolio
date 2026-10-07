"use client";

import { CLINIC_NAME, ROOMS } from "./constants";
import { waitingList } from "./queue-store";
import { useClinicStore } from "./useClinicStore";

type Props = {
  compact?: boolean;
};

export function LiveQueueStrip({ compact }: Props) {
  const state = useClinicStore();
  const waiting = waitingList(state);

  return (
    <div
      className={`rounded-2xl border border-border bg-card ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
      aria-live="polite"
    >
      <p className="text-xs font-medium text-muted-foreground">{CLINIC_NAME} · live</p>
      <div className={`mt-3 grid gap-3 ${compact ? "grid-cols-2" : "sm:grid-cols-3"}`}>
        {ROOMS.map((room) => {
          const rs = state.roomState[room.id];
          const current = rs.currentTicketId
            ? state.tickets.find((t) => t.id === rs.currentTicketId)
            : undefined;
          const serving = current?.queueNumber ?? rs.lastAnnouncedNumber ?? "—";
          return (
            <div key={room.id} className="rounded-xl border border-border bg-background/60 px-3 py-2">
              <p className="text-[10px] text-muted-foreground sm:text-xs">{room.label}</p>
              <p
                className={`font-mono font-bold tabular-nums text-foreground ${
                  compact ? "text-xl" : "text-2xl sm:text-3xl"
                }`}
              >
                {serving}
              </p>
            </div>
          );
        })}
        <div
          className={`rounded-xl border border-border bg-background/60 px-3 py-2 ${
            compact ? "col-span-2" : "sm:col-span-1"
          }`}
        >
          <p className="text-[10px] text-muted-foreground sm:text-xs">Waiting</p>
          <p className={`font-mono font-bold tabular-nums ${compact ? "text-xl" : "text-2xl sm:text-3xl"}`}>
            {waiting.length}
          </p>
        </div>
      </div>
    </div>
  );
}
