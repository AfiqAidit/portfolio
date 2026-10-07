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

/** Archived layout preview — main site is `/`. */
export default function ClassicStylePage() {
  return (
    <>
      <SiteNav />
      <SharedHero variant="Classic (archive)" />
      <AboutSection />
      <ExperienceSection />
      <EducationSection />
      <SideProjectsSection />
      <SkillsSection />
      <KnowMeSection />
      <SiteFooter />
    </>
  );
}
