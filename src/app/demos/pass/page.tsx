import type { Metadata } from "next";
import { PassStudio } from "@/components/demos/pass/PassStudio";

const title = "Hanging pass";
const description =
  "Pull the nylon strap, let the badge bounce, and click to flip it. A CSS 3D pass for this site.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", url: "/demos/pass", title, description },
  twitter: { card: "summary_large_image", title, description },
};

export default function PassDemoPage() {
  return <PassStudio />;
}
