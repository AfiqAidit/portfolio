import type { ClinicState } from "./queue-store";
import { orderedWaitingIds } from "./queue-store";
import type { ClinicAction } from "./queue-store";
import { ROOMS } from "./constants";

/** One simulated clinic step for auto-play */
export function nextAutoPlayAction(state: ClinicState): ClinicAction | null {
  const booked = state.tickets.filter((t) => t.status === "booked");
  const waitingIds = orderedWaitingIds(state);
  const inConsult = state.tickets.filter((t) => t.status === "in-consultation");

  if (inConsult.length > 0 && Math.random() < 0.45) {
    const t = inConsult[0];
    return { type: "finish", ticketId: t.id };
  }

  const freeRoom = ROOMS.find((r) => !state.roomState[r.id].currentTicketId);
  if (freeRoom && waitingIds.length > 0 && Math.random() < 0.5) {
    return { type: "callNext", roomId: freeRoom.id };
  }

  if (booked.length > 0 && Math.random() < 0.35) {
    return { type: "checkIn", ticketId: booked[0].id };
  }

  if (Math.random() < 0.15) {
    return {
      type: "addWalkIn",
      serviceId: "general",
      patientName: "Walk-in visitor",
    };
  }

  return null;
}
