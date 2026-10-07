import { redirect } from "next/navigation";

/** Former waiting-room URL; doctor view includes the public board. */
export default function ClinicDisplayRedirectPage() {
  redirect("/demos/clinic-queue/doctor");
}
