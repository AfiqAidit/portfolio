import type { Metadata } from "next";
import { OverviewClient } from "@/components/demos/clinic-queue/OverviewClient";

const title = "Clinic queue demo";
const description =
  "Simplified fictional clinic booking and live queue demo with browser-local data and multi-tab sync.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    type: "website",
    url: "/demos/clinic-queue",
    title,
    description,
    images: "/opengraph-image",
  },
  twitter: { card: "summary_large_image", title, description, images: "/opengraph-image" },
};

export default function ClinicQueueOverviewPage() {
  return <OverviewClient />;
}
