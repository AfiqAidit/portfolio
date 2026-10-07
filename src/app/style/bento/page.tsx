import { SiteNav, SiteFooter } from "@/components/shared/SiteNav";
import { BentoHome } from "@/components/bento/BentoHome";

/** Archived layout preview. The main site is `/`. */
export default function BentoStylePage() {
  return (
    <>
      <SiteNav />
      <BentoHome />
      <SiteFooter />
    </>
  );
}
