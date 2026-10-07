import { SiteNav, SiteFooter } from "@/components/shared/SiteNav";
import {
  AboutSection,
  ExperienceSection,
  EducationSection,
  SideProjectsSection,
  SkillsSection,
  KnowMeSection,
} from "@/components/shared/sections";
import { MotionHero } from "@/components/motion/MotionSections";

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main>
        <MotionHero />
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
