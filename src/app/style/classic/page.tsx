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

/** Archived layout preview. The main site is `/`. */
export default function ClassicStylePage() {
  return (
    <>
      <SiteNav />
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
