"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SERVICES, type ServiceId } from "./constants";
import { ClinicRoleChrome } from "./ClinicRoleChrome";
import { clinicStats, dispatchClinic } from "./queue-store";
import { useClinicStore } from "./useClinicStore";
import { formatDayLabel, formatSlotTime, slotDayKey, upcomingClinicDayKeys } from "./scheduling";
import { statusClass, statusLabel } from "./status-ui";

type Tab = "booked" | "waiting" | "active" | "done" | "noshow";

export function StaffClient() {
  const state = useClinicStore();
  const [tab, setTab] = useState<Tab>("booked");
  const [arrivalDay, setArrivalDay] = useState(() => upcomingClinicDayKeys()[0]);
  const [walkName, setWalkName] = useState("");
  const [walkService, setWalkService] = useState<ServiceId>("general");

  const days = useMemo(() => upcomingClinicDayKeys(), []);
  const stats = useMemo(() => clinicStats(state), [state]);
  const arrivalDayIndex = days.indexOf(arrivalDay);
  const canPrevDay = arrivalDayIndex > 0;
  const canNextDay = arrivalDayIndex >= 0 && arrivalDayIndex < days.length - 1;

  const shiftArrivalDay = (delta: -1 | 1) => {
    const i = days.indexOf(arrivalDay);
    const next = days[i + delta];
    if (next) setArrivalDay(next);
  };

  const lists = useMemo(() => {
    const arrivals = state.tickets.filter(
      (t) =>
        t.type === "appointment" &&
        t.status === "booked" &&
        t.slotIso &&
        slotDayKey(t.slotIso) === arrivalDay,
    );
    const waiting = state.tickets.filter((t) => t.status === "waiting");
    const active = state.tickets.filter(
      (t) => t.status === "called" || t.status === "in-consultation",
    );
    const done = state.tickets.filter((t) => t.status === "done" || t.status === "cancelled");
    const noshow = state.tickets.filter((t) => t.status === "no-show");
    return { arrivals, waiting, active, done, noshow };
  }, [state.tickets, arrivalDay]);

  const currentList =
    tab === "booked"
      ? lists.arrivals
      : tab === "waiting"
        ? lists.waiting
        : tab === "active"
          ? lists.active
          : tab === "noshow"
            ? lists.noshow
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
    <ClinicRoleChrome role="staff" wide>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Waiting now", value: stats.waiting },
          { label: "Served today", value: stats.served },
          { label: "Avg wait (min)", value: stats.avgWait },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card bg-gradient-to-br from-card to-band/50 p-4 text-center shadow-sm"
          >
            <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="font-mono text-xs text-accent">Queue</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["booked", "Online arrivals"],
                ["waiting", "Waiting"],
                ["active", "With doctor"],
                ["done", "Done"],
                ["noshow", "No-show"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`rounded-xl border px-3 py-1.5 text-xs font-medium shadow-sm ${
                  tab === id
                    ? "border-accent/40 bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-accent/40"
                }`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "booked" ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div
                className="inline-flex w-fit max-w-full items-stretch overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                role="group"
                aria-label="Appointment date"
              >
                <button
                  type="button"
                  className="inline-flex w-9 shrink-0 items-center justify-center text-foreground hover:bg-band disabled:opacity-40"
                  disabled={!canPrevDay}
                  aria-label="Previous day"
                  onClick={() => shiftArrivalDay(-1)}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <span
                  className="flex min-w-0 items-center justify-center border-x border-border px-3 py-2 text-center text-xs font-medium text-foreground sm:min-w-[11rem] sm:text-sm"
                >
                  {formatDayLabel(arrivalDay)}
                </span>
                <button
                  type="button"
                  className="inline-flex w-9 shrink-0 items-center justify-center text-foreground hover:bg-band disabled:opacity-40"
                  disabled={!canNextDay}
                  aria-label="Next day"
                  onClick={() => shiftArrivalDay(1)}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}

          <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
            {currentList.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {tab === "booked"
                  ? "No online bookings waiting for check-in on this date."
                  : "No patients in this list."}
              </li>
            ) : (
              currentList.map((t) => {
                const service = SERVICES.find((s) => s.id === t.serviceId)?.label;
                return (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">{t.patientName}</p>
                      {t.ic ? (
                        <p className="font-mono text-[10px] text-muted-foreground">IC {t.ic}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {service}
                        {t.slotIso
                          ? ` · ${formatDayLabel(slotDayKey(t.slotIso))} ${formatSlotTime(t.slotIso)}`
                          : ""}
                        {t.queueNumber ? ` · ${t.queueNumber}` : ""}
                      </p>
                      <p className={`mt-1 text-xs font-medium ${statusClass(t.status)}`}>
                        {statusLabel[t.status]}
                      </p>
                    </div>
                    {t.status === "booked" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-xl bg-accent px-4 py-2 text-xs font-medium text-accent-foreground shadow-sm"
                          onClick={() => dispatchClinic({ type: "checkIn", ticketId: t.id })}
                        >
                          Check in
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-red-400/50 bg-card px-3 py-2 text-xs font-medium text-red-600 shadow-sm dark:text-red-400"
                          onClick={() => dispatchClinic({ type: "noShow", ticketId: t.id })}
                        >
                          No-show
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card bg-gradient-to-br from-slate-500/5 to-card p-5 shadow-sm">
            <p className="font-mono text-xs text-accent">Walk-in</p>
            <h3 className="mt-1 text-base font-semibold text-foreground">Register at counter</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Walk-ins skip booking and go straight into the waiting queue.
            </p>
            <input
              className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm shadow-sm"
              placeholder="Patient name"
              value={walkName}
              onChange={(e) => setWalkName(e.target.value)}
            />
            <select
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm shadow-sm"
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
              className="mt-3 w-full rounded-xl bg-accent py-2.5 text-sm font-medium text-accent-foreground shadow-sm"
              onClick={addWalkIn}
            >
              Add to queue
            </button>
          </div>
        </div>
      </div>
    </ClinicRoleChrome>
  );
}
