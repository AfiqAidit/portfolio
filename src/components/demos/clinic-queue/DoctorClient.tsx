"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import { CLINIC_NAME, ROOMS, SERVICES } from "./constants";
import { ClinicRoleChrome } from "./ClinicRoleChrome";
import type { ClinicState } from "./queue-store";
import { dispatchClinic, waitingList } from "./queue-store";
import { useClinicStore } from "./useClinicStore";

function servingForRoom(state: ClinicState, roomId: (typeof ROOMS)[number]["id"]) {
  const rs = state.roomState[roomId];
  const current = rs.currentTicketId
    ? state.tickets.find((t) => t.id === rs.currentTicketId)
    : undefined;
  const room = ROOMS.find((r) => r.id === roomId)!;
  return {
    number: current?.queueNumber ?? rs.lastAnnouncedNumber ?? "—",
    flashKey: rs.lastAnnouncedAt ?? rs.lastAnnouncedNumber ?? "idle",
    current,
    room,
  };
}

export function DoctorClient() {
  const state = useClinicStore();
  const reduced = useReducedMotion();
  const [chimeOn, setChimeOn] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const [tvMode, setTvMode] = useState(false);
  const prevAnnounced = useRef("");
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const waiting = useMemo(() => waitingList(state), [state]);
  const nextNumbers = waiting
    .map((t) => t.queueNumber)
    .filter(Boolean)
    .slice(0, 6) as string[];

  const announcedKey = ROOMS.map((r) => state.roomState[r.id].lastAnnouncedAt ?? "").join("|");

  useEffect(() => {
    if (!chimeOn || reduced) return;
    if (announcedKey === prevAnnounced.current) return;
    prevAnnounced.current = announcedKey;
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.08;
      o.start();
      o.stop(ctx.currentTime + 0.15);
    } catch {
      /* ignore */
    }
  }, [announcedKey, chimeOn, reduced]);

  const exitTv = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    setTvMode(false);
  }, []);

  const enterTv = useCallback(async () => {
    setTvMode(true);
    try {
      await shellRef.current?.requestFullscreen();
    } catch {
      /* overlay still works */
    }
  }, []);

  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setTvMode(false);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const clockStr = clock.toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const board = (
    <section
      className={`rounded-2xl border border-border bg-card ${tvMode ? "p-6 sm:p-10" : "p-5 sm:p-8"}`}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-accent">Waiting room</p>
          <h3 className="text-lg font-semibold text-foreground">{CLINIC_NAME}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={chimeOn}
              onChange={(e) => setChimeOn(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Chime when called
          </label>
          <time className="font-mono tabular-nums">{clockStr}</time>
          {tvMode ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1"
              onClick={exitTv}
            >
              <Minimize2 className="h-3.5 w-3.5" aria-hidden />
              Exit TV
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-1 font-medium text-accent-foreground"
              onClick={() => void enterTv()}
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              TV view
            </button>
          )}
        </div>
      </div>

      <div className={`mt-6 grid gap-4 ${tvMode ? "lg:grid-cols-2" : "sm:grid-cols-2"}`}>
        {ROOMS.map((room) => {
          const { number, flashKey } = servingForRoom(state, room.id);
          return (
            <div
              key={room.id}
              className="rounded-xl border border-border bg-background/60 p-4 sm:p-6"
            >
              <p className="text-sm text-muted-foreground">{room.label} · {room.doctor}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Now serving
              </p>
              <motion.p
                key={flashKey}
                initial={reduced ? false : { scale: 0.94, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`mt-1 font-mono font-bold tabular-nums text-foreground ${
                  tvMode ? "text-6xl sm:text-8xl" : "text-4xl sm:text-5xl"
                }`}
              >
                {number}
              </motion.p>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {nextNumbers.length === 0 ? (
            <li className="text-sm text-muted-foreground">No one waiting</li>
          ) : (
            nextNumbers.map((n, i) => (
              <li
                key={n}
                className={`rounded-xl border font-mono tabular-nums ${
                  i === 0
                    ? "border-accent bg-accent/10 px-4 py-2 text-xl font-semibold"
                    : "border-border bg-background px-3 py-1.5 text-base"
                }`}
              >
                {n}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );

  if (tvMode) {
    return (
      <div
        ref={shellRef}
        className="clinic-demo-root fixed inset-0 z-[200] overflow-y-auto bg-background p-4 sm:p-8"
      >
        {board}
      </div>
    );
  }

  return (
    <ClinicRoleChrome role="doctor" wide>
      <p className="font-mono text-xs text-accent">Consultation rooms</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Doctors call the next patient and close the visit. Marking no-show is handled at the front
        desk. The board below is what patients see on the TV.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {ROOMS.map((room) => {
          const { current, number } = servingForRoom(state, room.id);
          const service =
            current && SERVICES.find((s) => s.id === current.serviceId)?.label;
          return (
            <article
              key={room.id}
              className="rounded-2xl border border-border bg-card bg-gradient-to-br from-cyan-500/5 to-card p-5 shadow-sm"
            >
              <p className="font-medium text-foreground">{room.label}</p>
              <p className="text-sm text-muted-foreground">{room.doctor}</p>
              {current ? (
                <div className="mt-4 rounded-xl border border-border bg-background/80 p-4">
                  <p className="font-mono text-2xl font-bold tabular-nums">{number}</p>
                  <p className="mt-1 font-medium">{current.patientName}</p>
                  <p className="text-xs text-muted-foreground">{service}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No patient in room</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-accent px-4 py-2 text-xs font-medium text-accent-foreground"
                  onClick={() => dispatchClinic({ type: "callNext", roomId: room.id })}
                >
                  Call next
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-border px-3 py-2 text-xs"
                  onClick={() => dispatchClinic({ type: "recall", roomId: room.id })}
                >
                  Recall
                </button>
                {current ? (
                  <button
                    type="button"
                    className="rounded-xl border border-border px-3 py-2 text-xs"
                    onClick={() => dispatchClinic({ type: "finish", ticketId: current.id })}
                  >
                    Finish visit
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-10">{board}</div>
    </ClinicRoleChrome>
  );
}
