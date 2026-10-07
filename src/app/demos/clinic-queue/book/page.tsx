import type { Metadata } from "next";
import { BookClient } from "@/components/demos/clinic-queue/BookClient";

export const metadata: Metadata = {
  title: "Clinic queue demo: Book",
  description: "Book an appointment at the fictional Demo Family Clinic.",
};

export default function ClinicBookPage() {
  return <BookClient />;
}
