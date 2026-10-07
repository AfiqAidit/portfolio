import { permanentRedirect } from "next/navigation";

/** Motion is the main site now; keep old links working. */
export default function MotionStylePage() {
  permanentRedirect("/");
}
