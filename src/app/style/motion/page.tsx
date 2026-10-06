import { SiteNav, SiteFooter } from "@/components/shared/SiteNav";
import {
  ExperienceList,
  UniversitySection,
  EducationSection,
  SkillsSection,
} from "@/components/shared/sections";
import { MotionHero, MotionFeaturedBento } from "@/components/motion/MotionSections";

/** Same as home — keeps /style/motion usable from the layout switcher */
export default function MotionStylePage() {
  return (
    <>
      <SiteNav />
      <MotionHero />
      <MotionFeaturedBento />
      <ExperienceList />
      <UniversitySection />
      <EducationSection />
      <SkillsSection />
      <SiteFooter />
    </>
  );
}
