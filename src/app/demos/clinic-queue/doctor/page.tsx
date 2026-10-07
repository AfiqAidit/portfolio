import type { Metadata } from "next";
import { DoctorClient } from "@/components/demos/clinic-queue/DoctorClient";

export const metadata: Metadata = {
  title: "Clinic queue demo: Doctor",
  description: "Doctor consultation console and waiting room display for the clinic queue demo.",
};

export default function ClinicDoctorPage() {
  return <DoctorClient />;
}
