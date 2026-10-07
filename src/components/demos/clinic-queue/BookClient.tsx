"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, MapPin } from "lucide-react";
import { CLINICS, SERVICES, type ClinicId, type ServiceId } from "./constants";
import { BookingStepper } from "./BookingStepper";
import { ClinicRoleChrome } from "./ClinicRoleChrome";
import { choiceCard, segmentBtn } from "./clinic-ui";
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
  slotDayKey,
  slotFull,
  slotsForDay,
  upcomingClinicDayKeys,
} from "./scheduling";
import { statusClass, statusLabel } from "./status-ui";

const UPCOMING = new Set(["booked", "waiting", "called", "in-consultation"]);
const HISTORY = new Set(["done", "cancelled", "no-show"]);

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:border-accent/40"
      onClick={onClick}
    >
      <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
      Back
    </button>
  );
}

export function BookClient() {
  const state = useClinicStore();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(1);
  const [clinicId, setClinicId] = useState<ClinicId | null>(null);
  const [serviceId, setServiceId] = useState<ServiceId | null>(null);
  const [day, setDay] = useState<string>(() => upcomingClinicDayKeys()[0]);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [ic, setIc] = useState("");
  const [view, setView] = useState<"book" | "appointments">("book");
  const [apptTab, setApptTab] = useState<"upcoming" | "history">("upcoming");

  const days = useMemo(() => upcomingClinicDayKeys(), []);
  const slots = useMemo(() => slotsForDay(day), [day]);

  const myIds = getMyTicketIds();
  const myTickets = myIds
    .map((id) => state.tickets.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => !!t);

  const upcoming = myTickets.filter((t) => UPCOMING.has(t.status));
  const history = myTickets.filter((t) => HISTORY.has(t.status));

  const patientViewSwitcher = (
    <div className="mb-6 flex flex-wrap justify-end gap-2">
      <button type="button" className={segmentBtn(view === "book")} onClick={() => setView("book")}>
        Book appointment
      </button>
      <button
        type="button"
        className={segmentBtn(view === "appointments")}
        onClick={() => setView("appointments")}
      >
        My appointments
      </button>
    </div>
  );

  const confirmBooking = () => {
    if (!clinicId || !serviceId || !slotIso || !fullName.trim() || !ic.trim()) return;
    const countBefore = getClinicState().tickets.length;
    dispatchClinic({
      type: "book",
      serviceId,
      patientName: fullName.trim(),
      ic: ic.trim(),
      slotIso,
    });
    const created = getClinicState().tickets[countBefore];
    if (created) rememberMyTicket(created.id);
    setStep(1);
    setClinicId(null);
    setServiceId(null);
    setSlotIso(null);
    setFullName("");
    setIc("");
    setView("appointments");
    setApptTab("upcoming");
  };

  const stepMotion = {
    initial: reduced ? false : { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: reduced ? undefined : { opacity: 0, x: -16 },
    transition: { duration: 0.22, ease: "easeOut" as const },
  };

  const clinic = CLINICS.find((c) => c.id === clinicId);

  return (
    <ClinicRoleChrome role="patient" wide>
      {patientViewSwitcher}
      {view === "appointments" ? (
        <div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium shadow-sm ${
                apptTab === "upcoming"
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-accent/40"
              }`}
              onClick={() => setApptTab("upcoming")}
            >
              Upcoming
            </button>
            <button
              type="button"
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium shadow-sm ${
                apptTab === "history"
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-accent/40"
              }`}
              onClick={() => setApptTab("history")}
            >
              History
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {(apptTab === "upcoming" ? upcoming : history).length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {apptTab === "upcoming"
                  ? "No upcoming appointments. Book a slot to see it here."
                  : "No past appointments yet."}
              </li>
            ) : (
              (apptTab === "upcoming" ? upcoming : history).map((t) => {
                const pos = t.status === "waiting" ? positionOf(state, t.id) : null;
                const wait = t.status === "waiting" ? estimatedWaitMinutes(state, t.id) : null;
                const service = SERVICES.find((s) => s.id === t.serviceId)?.label ?? t.serviceId;
                return (
                  <li key={t.id}>
                    <article
                      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                      aria-live="polite"
                    >
                      <p className="font-mono text-xs text-muted-foreground">Ref {t.refCode}</p>
                      <p className="mt-1 font-semibold text-foreground">{t.patientName}</p>
                      {t.ic ? (
                        <p className="font-mono text-xs text-muted-foreground">IC {t.ic}</p>
                      ) : null}
                      <p className="text-sm text-muted-foreground">{service}</p>
                      {t.slotIso ? (
                        <p className="mt-1 text-sm text-foreground">
                          {formatDayLabel(slotDayKey(t.slotIso))} at {formatSlotTime(t.slotIso)}
                        </p>
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
                          className="mt-3 rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400"
                          onClick={() => dispatchClinic({ type: "cancel", ticketId: t.id })}
                        >
                          Cancel appointment
                        </button>
                      ) : null}
                    </article>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : (
        <div className="overflow-hidden">
          <BookingStepper current={step} />

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step-1" {...stepMotion}>
                <p className="text-sm font-medium text-foreground">Choose a clinic</p>
                <ul className="mt-3 space-y-2">
                  {CLINICS.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={choiceCard(clinicId === c.id)}
                        onClick={() => {
                          setClinicId(c.id);
                          setStep(2);
                        }}
                      >
                        <span className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                          <span>
                            <span className="block font-semibold text-foreground">{c.name}</span>
                            <span className="mt-1 block text-xs text-muted-foreground">{c.area}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">{c.hours}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {step === 2 && clinicId && (
              <motion.div key="step-2" {...stepMotion}>
                <BackButton onClick={() => setStep(1)} />
                <p className="mt-3 text-sm font-medium text-foreground">Choose a service</p>
                <p className="text-xs text-muted-foreground">{clinic?.name}</p>
                <ul className="mt-3 space-y-2">
                  {SERVICES.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={choiceCard(serviceId === s.id)}
                        onClick={() => {
                          setServiceId(s.id);
                          setStep(3);
                        }}
                      >
                        <span className="font-medium text-foreground">{s.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">~{s.avgMinutes} min</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {step === 3 && clinicId && serviceId && (
              <motion.div key="step-3" {...stepMotion}>
                <BackButton onClick={() => setStep(2)} />
                <p className="mt-3 text-sm font-medium text-foreground">Pick date and time</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {days.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`rounded-xl border px-3 py-1.5 text-xs font-medium shadow-sm ${
                        day === d
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-card hover:border-accent/40"
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
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
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
                        className={`rounded-xl border px-2 py-2.5 text-xs font-medium shadow-sm ${
                          slotIso === iso
                            ? "border-accent bg-accent text-accent-foreground"
                            : disabled
                              ? "border-border opacity-40"
                              : "border-border bg-card hover:border-accent/40"
                        }`}
                        onClick={() => {
                          setSlotIso(iso);
                          setStep(4);
                        }}
                      >
                        {formatSlotTime(iso)}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 4 && clinicId && serviceId && slotIso && (
              <motion.div key="step-4" {...stepMotion}>
                <BackButton onClick={() => setStep(3)} />
                <p className="mt-3 text-sm font-medium text-foreground">Your details</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use dummy IC and name only. Nothing is sent to a server.
                </p>
                <label className="mt-4 block text-xs font-medium text-muted-foreground">
                  Full name (required)
                  <input
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ali Demo"
                  />
                </label>
                <label className="mt-3 block text-xs font-medium text-muted-foreground">
                  IC number (required, dummy)
                  <input
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground shadow-sm"
                    value={ic}
                    onChange={(e) => setIc(e.target.value)}
                    placeholder="e.g. 900101-14-5678"
                    inputMode="numeric"
                  />
                </label>
                <button
                  type="button"
                  className="mt-4 w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground shadow-sm disabled:opacity-50"
                  disabled={!fullName.trim() || !ic.trim()}
                  onClick={confirmBooking}
                >
                  Confirm appointment
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </ClinicRoleChrome>
  );
}
