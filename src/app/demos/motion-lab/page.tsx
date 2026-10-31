import type { Metadata } from "next";
import { MotionLabStudio } from "@/components/demos/motion-lab/MotionLabStudio";

const title = "Motion lab";
const description =
  "A WebGL kampung field at golden hour. Your cursor is a gust that bends the grass, with a stilt house, chickens, a pond, and a looping wind track.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", url: "/demos/motion-lab", title, description },
  twitter: { card: "summary_large_image", title, description },
};

export default function MotionLabDemoPage() {
  return <MotionLabStudio />;
}
