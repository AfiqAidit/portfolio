import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/shared/SiteNav";
import { BentoHome } from "@/components/bento/BentoHome";

export const metadata: Metadata = {
  title: "Bento layout (archive)",
  robots: { index: false, follow: false },
};

/** Archived layout preview. The main site is `/`. */
export default function BentoStylePage() {
  return (
    <>
      <SiteNav showLayoutSwitcher />
      <BentoHome />
      <SiteFooter />
    </>
  );
}
