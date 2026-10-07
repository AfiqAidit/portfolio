import type { ReactNode } from "react";
import Link from "next/link";
import { profile } from "@/content/profile";
import { experience } from "@/content/experience";
import { education, universityProjects } from "@/content/education";
import { skillGroups } from "@/content/skills";
import { sideProjects, sideProjectsIntro } from "@/content/side-projects";
import { knowMe } from "@/content/personal";
import { ContactEmail } from "./SiteNav";
import { SideProjectCard } from "./SideProjectCard";

function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-xs uppercase tracking-[0.2em] text-muted">{children}</h2>;
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

export function SharedHero({ variant }: { variant: string }) {
  return (
    <section className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted">
          {variant} layout
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {profile.shortName}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">{profile.title}</p>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {profile.tagline}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#experience"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
          >
            View experience
          </a>
          <ContactEmail />
        </div>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionLabel>About me</SectionLabel>
        <div className="mt-8 max-w-3xl space-y-4">
          {profile.about.map((p) => (
            <p key={p} className="text-base leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ExperienceSection() {
  return (
    <section id="experience" className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionLabel>Work experience</SectionLabel>
        <div className="mt-10 space-y-10">
          {experience.map((job) => (
            <article
              key={`${job.company}-${job.period}`}
              className="grid gap-3 border-l border-border pl-6 sm:grid-cols-[220px_1fr] sm:gap-8 sm:border-l-0 sm:pl-0"
            >
              <p className="whitespace-nowrap text-sm text-muted-foreground">{job.period}</p>
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  {job.title}
                  <span className="text-muted"> · </span>
                  {job.company}
                </h3>
                {job.note ? <p className="mt-1 text-sm italic text-muted">{job.note}</p> : null}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {job.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.stack.map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
        <Link
          href="/resume"
          className="mt-10 inline-block text-sm font-medium text-accent hover:underline"
        >
          Full details in my resume →
        </Link>
      </div>
    </section>
  );
}

export function EducationSection() {
  return (
    <section id="education" className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionLabel>Education</SectionLabel>
        <div className="mt-8 space-y-8">
          {education.map((e) => (
            <div key={e.school}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium text-foreground">{e.degree}</h3>
                <span className="text-sm text-muted">{e.period}</span>
              </div>
              <p className="text-sm text-muted-foreground">{e.school}</p>
              <p className="mt-1 text-sm text-muted-foreground">{e.detail}</p>
              {e.bullets.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                  {e.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
        <h3 className="mt-12 text-sm font-medium text-foreground">University & SIG activities</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {universityProjects.map((p) => (
            <div
              key={p.name}
              className="rounded-xl border border-border p-5"
              style={{ backgroundColor: "var(--card-muted)" }}
            >
              <h4 className="font-medium text-foreground">{p.name}</h4>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SideProjectsHeader() {
  return (
    <>
      <SectionLabel>{sideProjectsIntro.heading}</SectionLabel>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {sideProjectsIntro.subheading}
      </p>
    </>
  );
}

export function SideProjectsSection() {
  return (
    <section id="projects" className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SideProjectsHeader />
        <div className={`mt-8 grid gap-4 ${sideProjects.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {sideProjects.map((p) => (
            <SideProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function SkillsSection() {
  return (
    <section id="skills" className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionLabel>Skills</SectionLabel>
        <dl className="mt-8 space-y-4">
          {skillGroups.map((g) => (
            <div key={g.label} className="grid gap-1 sm:grid-cols-[140px_1fr]">
              <dt className="text-sm font-medium text-muted-foreground">{g.label}</dt>
              <dd className="text-sm text-muted-foreground">{g.items}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function KnowMeSection() {
  return (
    <section id="know-me" className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionLabel>{knowMe.heading}</SectionLabel>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">{knowMe.intro}</p>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          {knowMe.facts.map((f) => (
            <div
              key={f.label}
              className="rounded-xl border border-border p-5"
              style={{ backgroundColor: "var(--card-muted)" }}
            >
              <dt className="text-xs uppercase tracking-wider text-muted">{f.label}</dt>
              <dd className="mt-2 text-sm text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>
        {knowMe.interests.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {knowMe.interests.map((i) => (
              <Chip key={i}>{i}</Chip>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
