import { SiteNav, SiteFooter } from "@/components/shared/SiteNav";
import {
  SharedHero,
  FeaturedGrid,
  ExperienceList,
  UniversitySection,
  EducationSection,
  SkillsSection,
} from "@/components/shared/sections";

/** Archived layout preview — main site is `/` (motion + classic sections). */
export default function ClassicStylePage() {
  return (
    <>
      <SiteNav />
      <SharedHero variant="Classic (archive)" />
      <FeaturedGrid />
      <ExperienceList />
      <UniversitySection />
      <EducationSection />
      <SkillsSection />
      <SiteFooter />
    </>
  );
}
