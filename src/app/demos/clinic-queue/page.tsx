import type { Metadata } from "next";
import { OverviewClient } from "@/components/demos/clinic-queue/OverviewClient";

export const metadata: Metadata = {
  title: "Clinic queue demo",
  description:
    "Simplified fictional clinic booking and live queue demo with browser-local data and multi-tab sync.",
};

export default function ClinicQueueOverviewPage() {
  return <OverviewClient />;
}
