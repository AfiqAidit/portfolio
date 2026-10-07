import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

export const alt = `${profile.shortName} | ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#050505",
          backgroundImage:
            "radial-gradient(circle at 12% 0%, rgba(96,165,250,0.35), transparent 45%), radial-gradient(circle at 95% 100%, rgba(34,211,238,0.25), transparent 45%), radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.5px)",
          backgroundSize: "100% 100%, 100% 100%, 28px 28px",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: "#a1a1aa" }}>
          <div style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: "#60a5fa" }} />
          {`${profile.title} · ${profile.location}`}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
            {profile.shortName}
          </div>
          <div style={{ marginTop: 28, fontSize: 36, color: "#a1a1aa", maxWidth: 900 }}>
            {profile.tagline}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#60a5fa" }}>
          {profile.siteUrl.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    size,
  );
}
