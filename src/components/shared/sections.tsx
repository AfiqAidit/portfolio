import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Feather,
  Gamepad2,
  GraduationCap,
  Languages,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { profile } from "@/content/profile";
import { experience } from "@/content/experience";
import { education, universityProjects } from "@/content/education";
import { skillGroups } from "@/content/skills";
import { sideProjects, sideProjectsIntro } from "@/content/side-projects";
import { knowMe, type KnowMeIcon } from "@/content/personal";
import { ContactEmail } from "./SiteNav";
import { SideProjectCard } from "./SideProjectCard";
import { Reveal } from "./Reveal";

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
    <Reveal className="max-w-2xl">
      <p className="font-mono text-xs text-accent">{index}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </Reveal>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs text-muted-foreground">
      {children}
    </span>
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

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-28 py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
        <SectionHeader index="01" title="About me" />
        <Reveal className="space-y-5 text-lg leading-relaxed text-muted-foreground" delay={0.1}>
          {profile.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Reveal>
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
        <ol className="mt-12">
          {experience.map((job, i) => {
            const current = job.period.endsWith("Present");
            const last = i === experience.length - 1;
            return (
              <li
                key={`${job.company}-${job.period}`}
                className="grid gap-2 sm:grid-cols-[180px_1fr] sm:gap-8"
              >
                <p className="font-mono text-xs text-muted sm:pt-7 sm:text-right">{job.period}</p>
                <div className={`relative border-l border-border pl-6 ${last ? "" : "pb-8"}`}>
                  <span
                    aria-hidden
                    className={`absolute -left-[5px] top-7 h-2.5 w-2.5 rounded-full ring-4 ring-background ${
                      current ? "bg-accent" : "bg-muted"
                    }`}
                  />
                  <Reveal>
                    <article className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-accent/40">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                        </div>
                        {current ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                            Current
                          </span>
                        ) : null}
                      </div>
                      {job.note ? <p className="mt-1 text-xs italic text-muted">{job.note}</p> : null}
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        {job.summary}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.stack.map((s) => (
                          <Chip key={s}>{s}</Chip>
                        ))}
                      </div>
                    </article>
                  </Reveal>
                </div>
              </li>
            );
          })}
        </ol>
        <Link
          href="/resume"
          className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline sm:ml-[212px]"
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
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {education.map((e, i) => (
            <Reveal key={e.school} delay={i * 0.08} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                <p className="font-mono text-xs text-muted">{e.period}</p>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{e.degree}</h3>
                <p className="text-sm text-muted-foreground">{e.school}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-foreground">
                    {e.cgpa}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-muted">CGPA</span>
                </div>
                {e.bullets.length > 0 ? (
                  <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                    {e.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-12">
          <h3 className="text-sm font-semibold text-foreground">University & SIG activities</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {universityProjects.map((p) => (
              <li key={p.name} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium text-foreground">{p.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
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
              <SideProjectCard project={p} className="h-full" />
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
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((g, i) => (
            <Reveal key={g.label} delay={(i % 3) * 0.06} className="h-full">
              <div className="h-full rounded-2xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold text-foreground">{g.label}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {g.items.map((item) => (
                    <Chip key={item}>{item}</Chip>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function KnowMeSection() {
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
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {knowMe.facts.map((f, i) => {
            const Icon = knowMeIcons[f.icon];
            return (
              <li key={f.label} className="h-full">
                <Reveal delay={(i % 3) * 0.06} className="h-full">
                  <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted">{f.label}</p>
                      <p className="mt-1 text-sm text-foreground">{f.value}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
