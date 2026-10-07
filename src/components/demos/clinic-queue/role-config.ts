import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Stethoscope, UserRound, Users } from "lucide-react";

export type ClinicRole = "overview" | "patient" | "staff" | "doctor";

export type RoleConfig = {
  index: string;
  title: string;
  subtitle: string;
  gradient: string;
  icon: LucideIcon;
};

export const ROLE_CONFIG: Record<ClinicRole, RoleConfig> = {
  overview: {
    index: "Hub",
    title: "Clinic demo overview",
    subtitle: "See the live queue, load sample data, and open each role in its own screen.",
    gradient: "from-accent/10 via-background to-accent-2/5",
    icon: LayoutGrid,
  },
  patient: {
    index: "Patient",
    title: "Book an appointment",
    subtitle: "Choose a service and time slot, then follow your ticket in the queue.",
    gradient: "from-sky-500/12 via-background to-cyan-500/5",
    icon: UserRound,
  },
  staff: {
    index: "Front desk",
    title: "Staff console",
    subtitle: "Check in online bookings and register walk-in patients. No login in this demo.",
    gradient: "from-slate-500/10 via-background to-zinc-500/5",
    icon: Users,
  },
  doctor: {
    index: "Consultation",
    title: "Doctor and waiting room",
    subtitle: "Call the next patient, run the consult, and show the live board patients see.",
    gradient: "from-cyan-500/12 via-background to-teal-500/5",
    icon: Stethoscope,
  },
};
