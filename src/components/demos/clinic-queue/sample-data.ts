import type { ClinicState, Ticket } from "./queue-store";
import { dayKey, slotsForDay } from "./scheduling";

function newId(i: number) {
  return `sample-${i}`;
}

export function buildSampleState(): ClinicState {
  const dk = dayKey(new Date());
  const slots = slotsForDay(dk).filter((s) => s.getHours() >= 9);
  const pick = (i: number) => slots[Math.min(i * 2, slots.length - 1)]?.toISOString();

  const tickets: Ticket[] = [
    {
      id: newId(1),
      refCode: "DFC-8K2M",
      type: "appointment",
      serviceId: "general",
      patientName: "Alex Tan",
      status: "booked",
      slotIso: pick(1),
      createdAt: new Date().toISOString(),
    },
    {
      id: newId(2),
      refCode: "DFC-3P9L",
      type: "appointment",
      serviceId: "followup",
      patientName: "Siti Rahman",
      status: "booked",
      slotIso: pick(2),
      createdAt: new Date().toISOString(),
    },
    {
      id: newId(3),
      refCode: "DFC-7H4Q",
      type: "appointment",
      serviceId: "vaccination",
      patientName: "Jordan Lee",
      status: "waiting",
      slotIso: pick(0),
      queueNumber: "A001",
      checkedInAt: new Date(Date.now() - 25 * 60000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: newId(4),
      refCode: "DFC-2N8W",
      type: "appointment",
      serviceId: "general",
      patientName: "Mei Ling",
      status: "waiting",
      slotIso: pick(0),
      queueNumber: "A002",
      checkedInAt: new Date(Date.now() - 20 * 60000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: newId(5),
      refCode: "DFC-5R1T",
      type: "walk-in",
      serviceId: "general",
      patientName: "Walk-in patient",
      status: "waiting",
      queueNumber: "W001",
      checkedInAt: new Date(Date.now() - 10 * 60000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: newId(6),
      refCode: "DFC-9V3C",
      type: "appointment",
      serviceId: "checkup",
      patientName: "Hassan Ali",
      status: "in-consultation",
      slotIso: pick(0),
      queueNumber: "A003",
      roomId: "room1",
      checkedInAt: new Date(Date.now() - 40 * 60000).toISOString(),
      calledAt: new Date(Date.now() - 15 * 60000).toISOString(),
      consultStartedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: newId(7),
      refCode: "DFC-4J6K",
      type: "appointment",
      serviceId: "followup",
      patientName: "Nur Aina",
      status: "done",
      slotIso: pick(0),
      queueNumber: "A004",
      roomId: "room2",
      checkedInAt: new Date(Date.now() - 90 * 60000).toISOString(),
      calledAt: new Date(Date.now() - 70 * 60000).toISOString(),
      consultStartedAt: new Date(Date.now() - 70 * 60000).toISOString(),
      finishedAt: new Date(Date.now() - 55 * 60000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: newId(8),
      refCode: "DFC-1D5F",
      type: "walk-in",
      serviceId: "vaccination",
      patientName: "Walk-in B",
      status: "waiting",
      queueNumber: "W002",
      checkedInAt: new Date(Date.now() - 5 * 60000).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  for (let i = 9; i <= 12; i++) {
    tickets.push({
      id: newId(i),
      refCode: `DFC-S${i}`,
      type: "appointment",
      serviceId: i % 2 === 0 ? "general" : "followup",
      patientName: `Patient ${i}`,
      status: "booked",
      slotIso: pick(i - 6),
      createdAt: new Date().toISOString(),
    });
  }

  return {
    version: 1,
    dayKey: dk,
    counters: { appointment: 4, walkIn: 2 },
    tickets,
    roomState: {
      room1: { currentTicketId: newId(6), lastAnnouncedNumber: "A003", lastAnnouncedAt: new Date().toISOString() },
      room2: { lastAnnouncedNumber: "A004", lastAnnouncedAt: new Date(Date.now() - 55 * 60000).toISOString() },
    },
    autoPlay: false,
  };
}
