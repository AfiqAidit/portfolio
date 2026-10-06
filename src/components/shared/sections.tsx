import { profile } from "@/content/profile";
import { experience } from "@/content/experience";
import { education, universityProjects } from "@/content/education";
import { featuredWork, featuredWorkIntro } from "@/content/featured-work";
import { FeaturedWorkCard } from "@/components/shared/FeaturedWorkCard";
import { skillGroups } from "@/content/skills";
import { ContactEmail } from "./SiteNav";

export function SharedHero({ variant }: { variant: string }) {
  return (
    <section className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted">
          {variant} layout
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {profile.title}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">{profile.name}</p>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {profile.summary}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#work"
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

export function ExperienceList() {
  return (
    <section id="work" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted">Experience</h2>
        <div className="mt-10 space-y-12">
          {experience.map((job) => (
            <article
              key={`${job.company}-${job.period}`}
              className="grid gap-4 border-l border-border pl-6 sm:grid-cols-[220px_1fr] sm:gap-8 sm:border-l-0 sm:pl-0"
            >
              <div className="text-sm text-muted">
                <p className="whitespace-nowrap text-muted-foreground">{job.period}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  {job.title}
                  <span className="text-muted"> · </span>
                  {job.company}
                </h3>
                {job.note ? (
                  <p className="mt-1 text-sm italic text-muted">{job.note}</p>
                ) : null}
                <ul className="mt-4 space-y-3">
                  {job.highlights.map((h, i) => (
                    <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                      {h.label ? (
                        <span className="font-medium text-foreground">{h.label}: </span>
                      ) : null}
                      {h.text}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedGrid({ className = "" }: { className?: string }) {
  return (
    <section id="projects" className={`py-16 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted">
          {featuredWorkIntro.heading}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {featuredWorkIntro.subheading}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {featuredWork.map((p) => (
            <FeaturedWorkCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function UniversitySection() {
  return (
    <section className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted">
          University & SIG
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {universityProjects.map((p) => (
            <div
              key={p.name}
              className="rounded-xl border border-border p-5"
              style={{ backgroundColor: "var(--card-muted)" }}
            >
              <h3 className="font-medium text-foreground">{p.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EducationSection() {
  return (
    <section className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted">Education</h2>
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
      </div>
    </section>
  );
}

export function SkillsSection() {
  return (
    <section className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted">Skills</h2>
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
