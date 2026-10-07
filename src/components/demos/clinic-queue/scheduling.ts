import { SLOT_MINUTES, SLOTS_PER_TIME } from "./constants";

type BookableTicket = {
  slotIso?: string;
  status: string;
  type: string;
};

/** Monday to Saturday are clinic days */
export function isClinicDay(date: Date) {
  const d = date.getDay();
  return d >= 1 && d <= 6;
}

export function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDayKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Today plus the next 6 clinic days */
export function upcomingClinicDayKeys(from = new Date()) {
  const keys: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (keys.length < 7) {
    if (isClinicDay(cursor)) keys.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export function formatDayLabel(key: string) {
  const d = parseDayKey(key);
  const today = dayKey(new Date());
  const opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
  const label = d.toLocaleDateString("en-MY", opts);
  return key === today ? `Today, ${label}` : label;
}

function sessionBounds(date: Date) {
  const morningStart = new Date(date);
  morningStart.setHours(9, 0, 0, 0);
  const morningEnd = new Date(date);
  morningEnd.setHours(13, 0, 0, 0);
  const afternoonStart = new Date(date);
  afternoonStart.setHours(14, 0, 0, 0);
  const afternoonEnd = new Date(date);
  afternoonEnd.setHours(18, 0, 0, 0);
  return { morningStart, morningEnd, afternoonStart, afternoonEnd };
}

export function slotsForDay(dayKeyStr: string) {
  const date = parseDayKey(dayKeyStr);
  const { morningStart, morningEnd, afternoonStart, afternoonEnd } = sessionBounds(date);
  const slots: Date[] = [];
  const pushRange = (start: Date, end: Date) => {
    const t = new Date(start);
    while (t < end) {
      slots.push(new Date(t));
      t.setMinutes(t.getMinutes() + SLOT_MINUTES);
    }
  };
  pushRange(morningStart, morningEnd);
  pushRange(afternoonStart, afternoonEnd);
  return slots;
}

export function slotIso(slot: Date) {
  return slot.toISOString();
}

export function formatSlotTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function isSlotPast(iso: string, now = new Date()) {
  return new Date(iso).getTime() < now.getTime();
}

export function bookingsInSlot(tickets: BookableTicket[], slotIsoStr: string) {
  return tickets.filter(
    (t) =>
      t.slotIso === slotIsoStr &&
      t.status !== "cancelled" &&
      t.status !== "no-show" &&
      t.type === "appointment",
  );
}

export function slotDayKey(slotIsoStr: string) {
  return dayKey(new Date(slotIsoStr));
}

export function slotFull(tickets: BookableTicket[], slotIsoStr: string) {
  return bookingsInSlot(tickets, slotIsoStr).length >= SLOTS_PER_TIME;
}
