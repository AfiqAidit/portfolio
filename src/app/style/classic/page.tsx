import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/shared/SiteNav";
import {
  SharedHero,
  AboutSection,
  ExperienceSection,
  EducationSection,
  SideProjectsSection,
  SkillsSection,
  KnowMeSection,
} from "@/components/shared/sections";

export const metadata: Metadata = {
  title: "Classic layout (archive)",
  robots: { index: false, follow: false },
};

/** Archived layout preview. The main site is `/`. */
export default function ClassicStylePage() {
  return (
    <>
      <SiteNav showLayoutSwitcher />
      <main>
        <SharedHero variant="Classic (archive)" />
        <AboutSection />
        <ExperienceSection />
        <EducationSection />
        <SideProjectsSection />
        <SkillsSection />
        <KnowMeSection />
      </main>
      <SiteFooter />
    </>
  );
}
