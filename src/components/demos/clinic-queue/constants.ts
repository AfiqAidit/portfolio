export const CLINIC_NAME = "Demo Family Clinic";
export const STORAGE_KEY = "clinic-demo:v1";
export const MY_TICKETS_KEY = "clinic-demo:my-tickets";

export type ServiceId = "general" | "followup" | "checkup" | "vaccination";
export type RoomId = "room1" | "room2";
export type TicketStatus =
  | "booked"
  | "waiting"
  | "called"
  | "in-consultation"
  | "done"
  | "cancelled"
  | "no-show";

export const SERVICES: { id: ServiceId; label: string; avgMinutes: number }[] = [
  { id: "general", label: "General consultation", avgMinutes: 10 },
  { id: "followup", label: "Follow-up", avgMinutes: 7 },
  { id: "checkup", label: "Medical check-up", avgMinutes: 15 },
  { id: "vaccination", label: "Vaccination", avgMinutes: 5 },
];

export const ROOMS: { id: RoomId; label: string; doctor: string }[] = [
  { id: "room1", label: "Room 1", doctor: "Dr. Lim" },
  { id: "room2", label: "Room 2", doctor: "Dr. Farah" },
];

export const SLOT_MINUTES = 15;
export const SLOTS_PER_TIME = 2;

export function serviceAvgMinutes(id: ServiceId) {
  return SERVICES.find((s) => s.id === id)?.avgMinutes ?? 10;
}
