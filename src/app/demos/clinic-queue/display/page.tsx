import type { Metadata } from "next";
import { DisplayClient } from "@/components/demos/clinic-queue/DisplayClient";

export const metadata: Metadata = {
  title: "Clinic queue demo: Display",
  description: "Waiting room display for the fictional clinic queue demo.",
};

export default function ClinicDisplayPage() {
  return <DisplayClient />;
}
