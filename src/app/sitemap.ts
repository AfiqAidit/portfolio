import type { MetadataRoute } from "next";
import { profile } from "@/content/profile";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: profile.siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${profile.siteUrl}/resume`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
