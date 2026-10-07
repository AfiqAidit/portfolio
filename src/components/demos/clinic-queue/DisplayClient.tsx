"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CLINIC_NAME, ROOMS } from "./constants";
import { DemoBadge } from "./ClinicShell";
import { waitingList } from "./queue-store";
import { useClinicStore } from "./useClinicStore";

export function DisplayClient() {
  const state = useClinicStore();
  const reduced = useReducedMotion();
  const [chimeOn, setChimeOn] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const prevAnnounced = useRef<string>("");

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
      /* autoplay blocked */
    }
  }, [announcedKey, chimeOn, reduced]);

  return (
    <div className="clinic-demo-root flex min-h-0 flex-1 flex-col bg-background p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold sm:text-xl">{CLINIC_NAME}</h2>
          <DemoBadge />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={chimeOn}
              onChange={(e) => setChimeOn(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Chime when called
          </label>
          <time className="font-mono text-sm tabular-nums text-muted-foreground">
            {clock.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </div>

      <div className="mt-6 grid flex-1 gap-4 lg:grid-cols-2" aria-live="polite">
        {ROOMS.map((room) => {
          const rs = state.roomState[room.id];
          const current = rs.currentTicketId
            ? state.tickets.find((t) => t.id === rs.currentTicketId)
            : undefined;
          const serving = current?.queueNumber ?? rs.lastAnnouncedNumber ?? "—";
          const flash = rs.lastAnnouncedAt;
          return (
            <section
              key={room.id}
              className="flex flex-col justify-center rounded-2xl border border-border bg-card p-6 sm:p-10"
            >
              <p className="text-sm text-muted-foreground">{room.label} · {room.doctor}</p>
              <p className="mt-2 text-sm font-medium text-muted-foreground">Now serving</p>
              <motion.p
                key={flash ?? serving}
                initial={reduced ? false : { scale: 0.95, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-1 font-mono text-5xl font-bold tabular-nums text-foreground sm:text-7xl"
              >
                {serving}
              </motion.p>
            </section>
          );
        })}
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <p className="text-sm font-medium text-muted-foreground">Next</p>
        <ul className="mt-2 flex flex-wrap gap-3">
          {nextNumbers.length === 0 ? (
            <li className="text-sm text-muted-foreground">No one waiting</li>
          ) : (
            nextNumbers.map((n) => (
              <li
                key={n}
                className="rounded-lg border border-border bg-background px-4 py-2 font-mono text-lg tabular-nums"
              >
                {n}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
