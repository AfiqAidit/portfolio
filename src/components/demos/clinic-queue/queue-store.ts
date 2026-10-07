import {
  MY_TICKETS_KEY,
  ROOMS,
  STORAGE_KEY,
  type RoomId,
  type ServiceId,
  type TicketStatus,
  serviceAvgMinutes,
} from "./constants";
import { dayKey, slotFull } from "./scheduling";
import { buildSampleState } from "./sample-data";

export type Ticket = {
  id: string;
  refCode: string;
  type: "appointment" | "walk-in";
  serviceId: ServiceId;
  patientName: string;
  /** Dummy IC for demo only */
  ic?: string;
  phone?: string;
  status: TicketStatus;
  slotIso?: string;
  queueNumber?: string;
  roomId?: RoomId;
  checkedInAt?: string;
  calledAt?: string;
  consultStartedAt?: string;
  finishedAt?: string;
  createdAt: string;
};

export type ClinicState = {
  version: 1;
  dayKey: string;
  counters: { appointment: number; walkIn: number };
  tickets: Ticket[];
  roomState: Record<
    RoomId,
    { currentTicketId?: string; lastAnnouncedNumber?: string; lastAnnouncedAt?: string }
  >;
  autoPlay: boolean;
};

export type ClinicAction =
  | {
      type: "book";
      serviceId: ServiceId;
      patientName: string;
      ic: string;
      slotIso: string;
    }
  | { type: "cancel"; ticketId: string }
  | { type: "checkIn"; ticketId: string }
  | { type: "addWalkIn"; serviceId: ServiceId; patientName: string }
  | { type: "callNext"; roomId: RoomId }
  | { type: "recall"; roomId: RoomId }
  | { type: "start"; ticketId: string }
  | { type: "finish"; ticketId: string }
  | { type: "noShow"; ticketId: string }
  | { type: "reset" }
  | { type: "loadSample" }
  | { type: "setAutoPlay"; on: boolean }
  | { type: "hydrate"; state: ClinicState };

function emptyState(): ClinicState {
  const dk = dayKey(new Date());
  return {
    version: 1,
    dayKey: dk,
    counters: { appointment: 0, walkIn: 0 },
    tickets: [],
    roomState: { room1: {}, room2: {} },
    autoPlay: false,
  };
}

function nextRefCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "DFC-";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function newId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ensureToday(state: ClinicState): ClinicState {
  const today = dayKey(new Date());
  if (state.dayKey === today) return state;
  return { ...emptyState(), autoPlay: state.autoPlay };
}

function allocQueueNumber(state: ClinicState, kind: "appointment" | "walk-in") {
  const key = kind === "appointment" ? "appointment" : "walkIn";
  const next = state.counters[key] + 1;
  const prefix = kind === "appointment" ? "A" : "W";
  const num = String(next).padStart(3, "0");
  return {
    number: `${prefix}${num}`,
    counters: { ...state.counters, [key]: next },
  };
}

/**
 * Waiting order: checked-in appointments whose slot time has passed, in slot order;
 * then everyone else by check-in / creation time.
 */
export function orderedWaitingIds(state: ClinicState, now = new Date()) {
  const waiting = state.tickets.filter((t) => t.status === "waiting");
  const slotDue = waiting
    .filter((t) => t.type === "appointment" && t.slotIso && new Date(t.slotIso) <= now)
    .sort((a, b) => (a.slotIso ?? "").localeCompare(b.slotIso ?? ""));
  const slotDueIds = new Set(slotDue.map((t) => t.id));
  const rest = waiting
    .filter((t) => !slotDueIds.has(t.id))
    .sort(
      (a, b) =>
        new Date(a.checkedInAt ?? a.createdAt).getTime() -
        new Date(b.checkedInAt ?? b.createdAt).getTime(),
    );
  return [...slotDue, ...rest].map((t) => t.id);
}

export function waitingList(state: ClinicState) {
  const ids = orderedWaitingIds(state);
  return ids.map((id) => state.tickets.find((t) => t.id === id)!).filter(Boolean);
}

export function positionOf(state: ClinicState, ticketId: string) {
  const ids = orderedWaitingIds(state);
  const idx = ids.indexOf(ticketId);
  return idx === -1 ? null : idx + 1;
}

export function estimatedWaitMinutes(state: ClinicState, ticketId: string) {
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket || ticket.status !== "waiting") return null;
  const ids = orderedWaitingIds(state);
  const idx = ids.indexOf(ticketId);
  if (idx === -1) return null;
  const ahead = ids.slice(0, idx).map((id) => state.tickets.find((t) => t.id === id)!);
  let minutes = ahead.reduce((sum, t) => sum + serviceAvgMinutes(t.serviceId), 0);
  for (const room of ROOMS) {
    const curId = state.roomState[room.id].currentTicketId;
    if (!curId) continue;
    const cur = state.tickets.find((t) => t.id === curId);
    if (cur && cur.status === "in-consultation" && cur.consultStartedAt) {
      const elapsed = (Date.now() - new Date(cur.consultStartedAt).getTime()) / 60000;
      const remain = Math.max(0, serviceAvgMinutes(cur.serviceId) - elapsed);
      minutes += remain;
    }
  }
  const openRooms = ROOMS.length;
  const raw = minutes / openRooms;
  return Math.max(5, Math.ceil(raw / 5) * 5);
}

function reducer(state: ClinicState, action: ClinicAction): ClinicState {
  state = ensureToday(state);

  switch (action.type) {
    case "hydrate":
      return ensureToday(action.state);
    case "reset":
      return { ...emptyState(), autoPlay: false };
    case "loadSample":
      return buildSampleState();
    case "setAutoPlay":
      return { ...state, autoPlay: action.on };
    case "book": {
      if (slotFull(state.tickets, action.slotIso)) return state;
      const ticket: Ticket = {
        id: newId(),
        refCode: nextRefCode(),
        type: "appointment",
        serviceId: action.serviceId,
        patientName: action.patientName.trim(),
        ic: action.ic.trim(),
        status: "booked",
        slotIso: action.slotIso,
        createdAt: new Date().toISOString(),
      };
      return { ...state, tickets: [...state.tickets, ticket] };
    }
    case "cancel": {
      const tickets = state.tickets.map((t) =>
        t.id === action.ticketId && t.status === "booked"
          ? { ...t, status: "cancelled" as const }
          : t,
      );
      return { ...state, tickets };
    }
    case "checkIn": {
      const t = state.tickets.find((x) => x.id === action.ticketId);
      if (!t || t.status !== "booked") return state;
      const { number, counters } = allocQueueNumber(state, "appointment");
      const tickets = state.tickets.map((x) =>
        x.id === action.ticketId
          ? {
              ...x,
              status: "waiting" as const,
              queueNumber: number,
              checkedInAt: new Date().toISOString(),
            }
          : x,
      );
      return { ...state, counters, tickets };
    }
    case "addWalkIn": {
      const { number, counters } = allocQueueNumber(state, "walk-in");
      const ticket: Ticket = {
        id: newId(),
        refCode: nextRefCode(),
        type: "walk-in",
        serviceId: action.serviceId,
        patientName: action.patientName.trim(),
        status: "waiting",
        queueNumber: number,
        checkedInAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      return { ...state, counters, tickets: [...state.tickets, ticket] };
    }
    case "callNext": {
      const ids = orderedWaitingIds(state);
      const nextId = ids[0];
      if (!nextId) return state;
      const next = state.tickets.find((t) => t.id === nextId)!;
      const tickets = state.tickets.map((t) =>
        t.id === nextId
          ? {
              ...t,
              status: "in-consultation" as const,
              roomId: action.roomId,
              calledAt: new Date().toISOString(),
              consultStartedAt: new Date().toISOString(),
            }
          : t,
      );
      const roomState = {
        ...state.roomState,
        [action.roomId]: {
          currentTicketId: nextId,
          lastAnnouncedNumber: next.queueNumber,
          lastAnnouncedAt: new Date().toISOString(),
        },
      };
      return { ...state, tickets, roomState };
    }
    case "recall": {
      const rs = state.roomState[action.roomId];
      if (!rs.lastAnnouncedNumber) return state;
      return {
        ...state,
        roomState: {
          ...state.roomState,
          [action.roomId]: { ...rs, lastAnnouncedAt: new Date().toISOString() },
        },
      };
    }
    case "start": {
      const tickets = state.tickets.map((t) =>
        t.id === action.ticketId && t.status === "called"
          ? {
              ...t,
              status: "in-consultation" as const,
              consultStartedAt: new Date().toISOString(),
            }
          : t,
      );
      return { ...state, tickets };
    }
    case "finish": {
      const t = state.tickets.find((x) => x.id === action.ticketId);
      if (!t) return state;
      const tickets = state.tickets.map((x) =>
        x.id === action.ticketId
          ? { ...x, status: "done" as const, finishedAt: new Date().toISOString() }
          : x,
      );
      let roomState = state.roomState;
      if (t.roomId && roomState[t.roomId].currentTicketId === action.ticketId) {
        roomState = {
          ...roomState,
          [t.roomId]: { ...roomState[t.roomId], currentTicketId: undefined },
        };
      }
      return { ...state, tickets, roomState };
    }
    case "noShow": {
      const t = state.tickets.find((x) => x.id === action.ticketId);
      if (!t) return state;
      const tickets = state.tickets.map((x) =>
        x.id === action.ticketId ? { ...x, status: "no-show" as const } : x,
      );
      let roomState = state.roomState;
      if (t.roomId && roomState[t.roomId].currentTicketId === action.ticketId) {
        roomState = {
          ...roomState,
          [t.roomId]: { ...roomState[t.roomId], currentTicketId: undefined },
        };
      }
      return { ...state, tickets, roomState };
    }
    default:
      return state;
  }
}

function isValidState(raw: unknown): raw is ClinicState {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as ClinicState;
  return o.version === 1 && Array.isArray(o.tickets) && typeof o.dayKey === "string";
}

function loadFromStorage(): ClinicState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidState(parsed)) return emptyState();
    return ensureToday(parsed);
  } catch {
    return emptyState();
  }
}

function persist(state: ClinicState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

const listeners = new Set<() => void>();
let state: ClinicState = emptyState();
let hydrated = false;
const CHANNEL = "clinic-demo-sync";

function notify() {
  listeners.forEach((l) => l());
}

function initBrowser() {
  if (typeof window === "undefined" || hydrated) return;
  hydrated = true;
  state = loadFromStorage();
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = () => {
      state = loadFromStorage();
      notify();
    };
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) {
        state = loadFromStorage();
        notify();
      }
    });
  } catch {
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) {
        state = loadFromStorage();
        notify();
      }
    });
  }
}

export function getClinicState() {
  initBrowser();
  return state;
}

export function subscribeClinic(listener: () => void) {
  initBrowser();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function dispatchClinic(action: ClinicAction) {
  initBrowser();
  state = reducer(state, action);
  persist(state);
  try {
    new BroadcastChannel(CHANNEL).postMessage({ t: Date.now() });
  } catch {
    /* single tab */
  }
  notify();
}

export function rememberMyTicket(ticketId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(MY_TICKETS_KEY);
    const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (!ids.includes(ticketId)) ids.unshift(ticketId);
    localStorage.setItem(MY_TICKETS_KEY, JSON.stringify(ids.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

export function getMyTicketIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MY_TICKETS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function clinicStats(state: ClinicState) {
  const today = state.tickets;
  const waiting = today.filter((t) => t.status === "waiting").length;
  const done = today.filter((t) => t.status === "done");
  const waits: number[] = [];
  for (const t of done) {
    if (t.checkedInAt && t.consultStartedAt) {
      waits.push(
        (new Date(t.consultStartedAt).getTime() - new Date(t.checkedInAt).getTime()) / 60000,
      );
    } else if (t.checkedInAt && t.calledAt) {
      waits.push((new Date(t.calledAt).getTime() - new Date(t.checkedInAt).getTime()) / 60000);
    }
  }
  const avgWait =
    waits.length > 0 ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
  return { waiting, served: done.length, avgWait };
}

export { emptyState };
