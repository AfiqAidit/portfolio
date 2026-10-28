import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Briefcase,
  Feather,
  Gamepad2,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { profile } from "@/content/profile";
import { experience } from "@/content/experience";
import { education, universityProjects } from "@/content/education";
import { sideProjects, sideProjectsIntro } from "@/content/side-projects";
import {
  knowMe,
  type KnowMeFact,
  type KnowMeIcon,
  type KnowMePhoto,
} from "@/content/personal";
import { ContactEmail } from "./SiteNav";
import { ClinicQueueCardPreview } from "@/components/demos/clinic-queue/ClinicQueueCardPreview";
import { GisMapCardPreview } from "@/components/demos/gis-map/GisMapCardPreview";
import { PassCardPreview } from "@/components/demos/pass/PassCardPreview";
import { SideProjectCard } from "./SideProjectCard";
import { Reveal } from "./Reveal";
import { Spotlight } from "./Spotlight";
import { ExperienceTimeline } from "./ExperienceTimeline";
import { SkillsExplorer } from "./SkillsExplorer";

const knowMeIcons: Record<KnowMeIcon, LucideIcon> = {
  gamepad: Gamepad2,
  feather: Feather,
  "map-pin": MapPin,
  languages: Languages,
  award: Award,
  "graduation-cap": GraduationCap,
};

function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

function SectionHeader({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 left-0 h-36 w-80 max-w-full rounded-full bg-accent/10 blur-3xl"
      />
      <Reveal className="relative max-w-2xl">
        <p className="font-mono text-xs text-accent">{index}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </Reveal>
    </div>
  );
}

export function SharedHero({ variant }: { variant: string }) {
  return (
    <section className="border-b border-border py-16 sm:py-20">
      <Container>
        <p className="mb-3 font-mono text-xs text-muted">{variant} layout</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {profile.shortName}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">{profile.title}</p>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {profile.tagline}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#experience"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
          >
            View experience
          </a>
          <ContactEmail />
        </div>
      </Container>
    </section>
  );
}

function shortCompany(company: string) {
  return company.replace(/\s+Sdn Bhd$/, "");
}

function AtAGlance() {
  const current = experience[0];
  const degree = education[0];
  const rows = [
    {
      icon: Briefcase,
      label: "Currently",
      value: `${current.title} at ${shortCompany(current.company)}`,
    },
    { icon: MapPin, label: "Based in", value: profile.location },
    {
      icon: GraduationCap,
      label: "Studied",
      value: `Computer Science, UKM (${degree.result.label} ${degree.result.value})`,
    },
  ];

  return (
    <Spotlight className="rounded-2xl border border-border bg-card p-6">
      <p className="font-mono text-xs text-muted">At a glance</p>
      <ul className="mt-5 space-y-4">
        {rows.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="text-xs text-muted">{label}</p>
              <p className="text-sm text-foreground">{value}</p>
            </div>
          </li>
        ))}
      </ul>
      <a
        href={`mailto:${profile.email}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
      >
        <Mail className="h-4 w-4" aria-hidden />
        {profile.email}
      </a>
    </Spotlight>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-28 py-20 sm:py-28">
      <Container>
        <SectionHeader index="01" title="About me" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
          <Reveal className="space-y-5 text-lg leading-relaxed text-muted-foreground">
            {profile.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>
          <Reveal delay={0.1}>
            <AtAGlance />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

export function ExperienceSection() {
  return (
    <section
      id="experience"
      className="scroll-mt-28 border-t border-border bg-band py-20 sm:py-28"
    >
      <Container>
        <SectionHeader
          index="02"
          title="Work experience"
          description="Where I've worked and what I did there, in short."
        />
        <ExperienceTimeline />
        <Link
          href="/resume"
          className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline pl-1.5 sm:ml-[200px] sm:pl-0"
        >
          Full details in my resume
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Container>
    </section>
  );
}

export function EducationSection() {
  return (
    <section id="education" className="scroll-mt-28 border-t border-border py-20 sm:py-28">
      <Container>
        <SectionHeader index="03" title="Education" />
        <div
          className={`mt-12 grid gap-4 sm:grid-cols-2 ${education.length > 2 ? "lg:grid-cols-3" : ""}`}
        >
          {education.map((e, i) => (
            <Reveal key={e.school} delay={i * 0.08} className="h-full">
              <Spotlight
                as="article"
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-6"
              >
                <p className="font-mono text-xs text-muted">{e.period}</p>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{e.degree}</h3>
                <p className="text-sm text-muted-foreground">{e.school}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-foreground">
                    {e.result.value}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-muted">
                    {e.result.label}
                  </span>
                </div>
                {e.bullets.length > 0 ? (
                  <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                    {e.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </Spotlight>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-12">
          <h3 className="text-sm font-semibold text-foreground">University & SIG activities</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {universityProjects.map((p) => (
              <li key={p.name}>
                <Spotlight className="h-full rounded-xl border border-border bg-card p-4">
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                </Spotlight>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}

export function SideProjectsSection() {
  return (
    <section
      id="projects"
      className="scroll-mt-28 border-t border-border bg-band py-20 sm:py-28"
    >
      <Container>
        <SectionHeader
          index="04"
          title={sideProjectsIntro.heading}
          description={sideProjectsIntro.subheading}
        />
        <div
          className={`mt-12 grid gap-4 ${sideProjects.length > 1 ? "sm:grid-cols-2" : "max-w-3xl"}`}
        >
          {sideProjects.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08} className="h-full">
              <SideProjectCard
                project={p}
                className="h-full"
                preview={
                  p.id === "gis-map"
                    ? <GisMapCardPreview />
                    : p.id === "clinic-queue"
                      ? <ClinicQueueCardPreview />
                      : p.id === "pass"
                        ? <PassCardPreview />
                        : undefined
                }
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function SkillsSection() {
  return (
    <section id="skills" className="scroll-mt-28 border-t border-border py-20 sm:py-28">
      <Container>
        <SectionHeader index="05" title="Skills" />
        <SkillsExplorer />
      </Container>
    </section>
  );
}

const photoGridCols: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

function KnowMeFactBody({ fact }: { fact: KnowMeFact }) {
  const Icon = knowMeIcons[fact.icon];
  return (
    <div className="flex gap-4 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted">{fact.label}</p>
        <p className="mt-1 text-sm text-foreground">{fact.value}</p>
      </div>
    </div>
  );
}

export function KnowMeSection() {
  const photoFacts = knowMe.facts.filter(
    (f): f is KnowMeFact & { photos: KnowMePhoto[] } => (f.photos?.length ?? 0) > 0,
  );
  const plainFacts = knowMe.facts.filter((f) => !f.photos?.length);
  return (
    <section
      id="know-me"
      className="scroll-mt-28 border-t border-border bg-band py-20 sm:py-28"
    >
      <Container>
        <SectionHeader index="06" title={knowMe.heading} description={knowMe.intro} />
        <Reveal className="mt-10">
          <blockquote className="max-w-3xl border-l-2 border-accent pl-6 text-xl leading-relaxed text-foreground sm:text-2xl">
            {knowMe.thinking}
          </blockquote>
        </Reveal>
        {photoFacts.length > 0 ? (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2">
            {photoFacts.map((f, i) => (
              <li key={f.label} className="h-full">
                <Reveal delay={(i % 2) * 0.06} className="h-full">
                  <Spotlight className="h-full overflow-hidden rounded-2xl border border-border bg-card">
                    <div
                      className={`grid aspect-[16/10] gap-0.5 border-b border-border bg-border ${photoGridCols[Math.min(f.photos.length, 3)]}`}
                    >
                      {f.photos.slice(0, 3).map((p) => (
                        <div key={p.src} className="relative bg-background">
                          <Image
                            src={`/personal/${p.src}`}
                            alt={p.alt}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 50vw"
                          />
                        </div>
                      ))}
                    </div>
                    <KnowMeFactBody fact={f} />
                  </Spotlight>
                </Reveal>
              </li>
            ))}
          </ul>
        ) : null}
        <ul
          className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${photoFacts.length > 0 ? "mt-4" : "mt-12"}`}
        >
          {plainFacts.map((f, i) => (
            <li key={f.label} className="h-full">
              <Reveal delay={(i % 3) * 0.06} className="h-full">
                <Spotlight className="h-full rounded-2xl border border-border bg-card">
                  <KnowMeFactBody fact={f} />
                </Spotlight>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
