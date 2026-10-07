"use client";

import { useMemo, useState } from "react";
import { CLINIC_NAME, SERVICES, type ServiceId } from "./constants";
import { DemoBadge } from "./ClinicShell";
import {
  dispatchClinic,
  estimatedWaitMinutes,
  getClinicState,
  getMyTicketIds,
  positionOf,
  rememberMyTicket,
} from "./queue-store";
import { useClinicStore } from "./useClinicStore";
import {
  formatDayLabel,
  formatSlotTime,
  isSlotPast,
  slotFull,
  slotsForDay,
  upcomingClinicDayKeys,
} from "./scheduling";
import { statusClass, statusLabel } from "./status-ui";

export function BookClient() {
  const state = useClinicStore();
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<ServiceId | null>(null);
  const [day, setDay] = useState<string>(() => upcomingClinicDayKeys()[0]);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [view, setView] = useState<"book" | "tickets">("book");

  const days = useMemo(() => upcomingClinicDayKeys(), []);
  const slots = useMemo(() => slotsForDay(day), [day]);

  const myIds = getMyTicketIds();
  const myTickets = myIds
    .map((id) => state.tickets.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => !!t && t.status !== "cancelled");

  const confirmBooking = () => {
    if (!serviceId || !slotIso || !name.trim()) return;
    const countBefore = getClinicState().tickets.length;
    dispatchClinic({
      type: "book",
      serviceId,
      patientName: name.trim(),
      phone: phone || undefined,
      slotIso,
    });
    const created = getClinicState().tickets[countBefore];
    if (created) rememberMyTicket(created.id);
    setStep(1);
    setServiceId(null);
    setSlotIso(null);
    setName("");
    setPhone("");
    setView("tickets");
  };

  return (
    <div className="clinic-demo-root mx-auto max-w-lg flex-1 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{CLINIC_NAME}</h2>
          <DemoBadge />
        </div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            className={view === "book" ? "font-medium text-accent" : "text-muted-foreground"}
            onClick={() => setView("book")}
          >
            Book
          </button>
          <button
            type="button"
            className={view === "tickets" ? "font-medium text-accent" : "text-muted-foreground"}
            onClick={() => setView("tickets")}
          >
            My ticket
          </button>
        </div>
      </div>

      {view === "tickets" ? (
        <div className="mt-6 space-y-4">
          {myTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets yet. Book an appointment first.</p>
          ) : (
            myTickets.map((t) => {
              const pos = t.status === "waiting" ? positionOf(state, t.id) : null;
              const wait = t.status === "waiting" ? estimatedWaitMinutes(state, t.id) : null;
              const service = SERVICES.find((s) => s.id === t.serviceId)?.label ?? t.serviceId;
              return (
                <article
                  key={t.id}
                  className="rounded-2xl border border-border bg-card p-4"
                  aria-live="polite"
                >
                  <p className="font-mono text-xs text-muted-foreground">Ref {t.refCode}</p>
                  <p className="mt-1 font-semibold text-foreground">{t.patientName}</p>
                  <p className="text-sm text-muted-foreground">{service}</p>
                  {t.slotIso ? (
                    <p className="mt-1 text-sm">{formatSlotTime(t.slotIso)}</p>
                  ) : null}
                  <p className={`mt-2 text-sm font-medium ${statusClass(t.status)}`}>
                    {statusLabel[t.status]}
                    {t.queueNumber ? ` · ${t.queueNumber}` : ""}
                  </p>
                  {pos !== null ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Position {pos}
                      {wait !== null ? ` · about ${wait} min` : ""}
                    </p>
                  ) : null}
                  {t.status === "booked" ? (
                    <button
                      type="button"
                      className="mt-3 text-sm text-red-600 hover:underline dark:text-red-400"
                      onClick={() => dispatchClinic({ type: "cancel", ticketId: t.id })}
                    >
                      Cancel booking
                    </button>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      ) : (
        <div className="mt-6">
          {step === 1 && (
            <div>
              <p className="text-sm font-medium text-foreground">1. Choose a service</p>
              <ul className="mt-3 space-y-2">
                {SERVICES.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${
                        serviceId === s.id
                          ? "border-accent bg-accent/10"
                          : "border-border bg-card"
                      }`}
                      onClick={() => {
                        setServiceId(s.id);
                        setStep(2);
                      }}
                    >
                      {s.label}
                      <span className="ml-2 text-xs text-muted-foreground">~{s.avgMinutes} min</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 2 && serviceId && (
            <div>
              <button type="button" className="text-xs text-accent" onClick={() => setStep(1)}>
                Back
              </button>
              <p className="mt-2 text-sm font-medium">2. Pick date and time</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`rounded-lg border px-2 py-1 text-xs ${
                      day === d ? "border-accent bg-accent/10" : "border-border"
                    }`}
                    onClick={() => {
                      setDay(d);
                      setSlotIso(null);
                    }}
                  >
                    {formatDayLabel(d)}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => {
                  const iso = slot.toISOString();
                  const past = isSlotPast(iso);
                  const full = slotFull(state.tickets, iso);
                  const disabled = past || full;
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={disabled}
                      className={`rounded-lg border px-2 py-2 text-xs ${
                        slotIso === iso
                          ? "border-accent bg-accent/10"
                          : disabled
                            ? "border-border opacity-40"
                            : "border-border bg-card"
                      }`}
                      onClick={() => {
                        setSlotIso(iso);
                        setStep(3);
                      }}
                    >
                      {formatSlotTime(iso)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && serviceId && slotIso && (
            <div>
              <button type="button" className="text-xs text-accent" onClick={() => setStep(2)}>
                Back
              </button>
              <p className="mt-2 text-sm font-medium">3. Your details</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Do not enter real personal details. Data stays in your browser.
              </p>
              <label className="mt-4 block text-xs text-muted-foreground">
                Name (required)
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="mt-3 block text-xs text-muted-foreground">
                Phone (optional, e.g. 012-345 6789)
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="mt-4 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
                disabled={!name.trim()}
                onClick={confirmBooking}
              >
                Confirm booking
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
