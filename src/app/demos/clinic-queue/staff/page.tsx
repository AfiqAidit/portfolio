import type { Metadata } from "next";
import { StaffClient } from "@/components/demos/clinic-queue/StaffClient";

export const metadata: Metadata = {
  title: "Clinic queue demo: Staff",
  description: "Staff console for the fictional clinic queue demo.",
};

export default function ClinicStaffPage() {
  return <StaffClient />;
}
