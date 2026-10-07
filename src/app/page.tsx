import { SiteNav, SiteFooter } from "@/components/shared/SiteNav";
import {
  AboutSection,
  ExperienceSection,
  EducationSection,
  SkillsSection,
  KnowMeSection,
} from "@/components/shared/sections";
import { MotionHero, MotionSideProjects } from "@/components/motion/MotionSections";

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <MotionHero />
      <AboutSection />
      <ExperienceSection />
      <EducationSection />
      <MotionSideProjects />
      <SkillsSection />
      <KnowMeSection />
      <SiteFooter />
    </>
  );
}
