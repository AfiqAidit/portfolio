import type { Metadata } from "next";
import { MotionLabStudio } from "@/components/demos/motion-lab/MotionLabStudio";

const title = "Motion lab";
const description =
  "Green WebGL grass that bends and parts under the cursor, then settles back. Soft pollen and optional ambience.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", url: "/demos/motion-lab", title, description },
  twitter: { card: "summary_large_image", title, description },
};

export default function MotionLabDemoPage() {
  return <MotionLabStudio />;
}
