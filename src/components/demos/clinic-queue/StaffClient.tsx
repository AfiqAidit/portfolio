"use client";

import { useMemo, useState } from "react";
import { CLINIC_NAME, ROOMS, SERVICES, type ServiceId } from "./constants";
import { DemoBadge } from "./ClinicShell";
import { clinicStats, dispatchClinic } from "./queue-store";
import { useClinicStore } from "./useClinicStore";
import { formatSlotTime } from "./scheduling";
import { statusClass, statusLabel } from "./status-ui";

type Tab = "booked" | "waiting" | "active" | "done";

export function StaffClient() {
  const state = useClinicStore();
  const [tab, setTab] = useState<Tab>("booked");
  const [walkName, setWalkName] = useState("");
  const [walkService, setWalkService] = useState<ServiceId>("general");

  const stats = useMemo(() => clinicStats(state), [state]);

  const lists = useMemo(() => {
    const booked = state.tickets.filter((t) => t.status === "booked");
    const waiting = state.tickets.filter((t) => t.status === "waiting");
    const active = state.tickets.filter(
      (t) => t.status === "called" || t.status === "in-consultation",
    );
    const done = state.tickets.filter(
      (t) => t.status === "done" || t.status === "no-show" || t.status === "cancelled",
    );
    return { booked, waiting, active, done };
  }, [state.tickets]);

  const currentList =
    tab === "booked"
      ? lists.booked
      : tab === "waiting"
        ? lists.waiting
        : tab === "active"
          ? lists.active
          : lists.done;

  const addWalkIn = () => {
    if (!walkName.trim()) return;
    dispatchClinic({
      type: "addWalkIn",
      serviceId: walkService,
      patientName: walkName.trim(),
    });
    setWalkName("");
    setTab("waiting");
  };

  return (
    <div className="clinic-demo-root mx-auto max-w-4xl flex-1 px-4 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{CLINIC_NAME} · Staff</h2>
        <DemoBadge />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        In a real system this screen is behind staff login.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-3 text-center text-xs sm:text-sm">
        <div>
          <p className="font-mono text-lg font-semibold tabular-nums">{stats.waiting}</p>
          <p className="text-muted-foreground">Waiting now</p>
        </div>
        <div>
          <p className="font-mono text-lg font-semibold tabular-nums">{stats.served}</p>
          <p className="text-muted-foreground">Served today</p>
        </div>
        <div>
          <p className="font-mono text-lg font-semibold tabular-nums">{stats.avgWait}</p>
          <p className="text-muted-foreground">Avg wait (min)</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium">Rooms</h3>
          <div className="mt-2 space-y-3">
            {ROOMS.map((room) => {
              const curId = state.roomState[room.id].currentTicketId;
              const cur = curId ? state.tickets.find((t) => t.id === curId) : undefined;
              return (
                <div key={room.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-medium">{room.label}</p>
                  <p className="text-xs text-muted-foreground">{room.doctor}</p>
                  {cur ? (
                    <p className="mt-2 font-mono text-sm">
                      {cur.queueNumber} · {cur.patientName}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Room free</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
                      onClick={() => dispatchClinic({ type: "callNext", roomId: room.id })}
                    >
                      Call next
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-1.5 text-xs"
                      onClick={() => dispatchClinic({ type: "recall", roomId: room.id })}
                    >
                      Recall
                    </button>
                    {cur ? (
                      <>
                        <button
                          type="button"
                          className="rounded-lg border border-border px-3 py-1.5 text-xs"
                          onClick={() => dispatchClinic({ type: "finish", ticketId: cur.id })}
                        >
                          Finish
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-400/50 px-3 py-1.5 text-xs text-red-600 dark:text-red-400"
                          onClick={() => dispatchClinic({ type: "noShow", ticketId: cur.id })}
                        >
                          No-show
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["booked", "Booked"],
                ["waiting", "Waiting"],
                ["active", "In consultation"],
                ["done", "Done / No-show"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`rounded-lg px-2 py-1 text-xs ${
                  tab === id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {currentList.length === 0 ? (
              <li className="text-sm text-muted-foreground">No patients in this list.</li>
            ) : (
              currentList.map((t) => {
                const service = SERVICES.find((s) => s.id === t.serviceId)?.label;
                return (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{t.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {service}
                        {t.slotIso ? ` · ${formatSlotTime(t.slotIso)}` : ""}
                        {t.queueNumber ? ` · ${t.queueNumber}` : ""}
                      </p>
                      <p className={`text-xs ${statusClass(t.status)}`}>{statusLabel[t.status]}</p>
                    </div>
                    {t.status === "booked" ? (
                      <button
                        type="button"
                        className="rounded-lg border border-border px-2 py-1 text-xs"
                        onClick={() => dispatchClinic({ type: "checkIn", ticketId: t.id })}
                      >
                        Check in
                      </button>
                    ) : null}
                    {t.status === "waiting" ? (
                      <button
                        type="button"
                        className="rounded-lg border border-red-400/50 px-2 py-1 text-xs text-red-600"
                        onClick={() => dispatchClinic({ type: "noShow", ticketId: t.id })}
                      >
                        No-show
                      </button>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium">Add walk-in</p>
            <input
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Patient name"
              value={walkName}
              onChange={(e) => setWalkName(e.target.value)}
            />
            <select
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={walkService}
              onChange={(e) => setWalkService(e.target.value as ServiceId)}
            >
              {SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-accent-foreground"
              onClick={addWalkIn}
            >
              Add to queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
