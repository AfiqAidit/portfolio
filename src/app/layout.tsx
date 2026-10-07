import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { profile } from "@/content/profile";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description = `${profile.title} in ${profile.location}, Malaysia. ${profile.tagline} Java, Spring Boot, full stack, and GIS experience.`;

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: {
    default: `${profile.shortName} | ${profile.title}`,
    template: `%s | ${profile.shortName}`,
  },
  description,
  authors: [{ name: profile.name, url: profile.siteUrl }],
  openGraph: {
    type: "website",
    url: "/",
    siteName: profile.shortName,
    title: `${profile.shortName} | ${profile.title}`,
    description,
    locale: "en_MY",
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.shortName} | ${profile.title}`,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
