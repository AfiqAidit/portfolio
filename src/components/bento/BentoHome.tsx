"use client";

import { motion } from "framer-motion";
import { profile } from "@/content/profile";
import { sideProjects } from "@/content/side-projects";
import { GisMapCardPreview } from "@/components/demos/gis-map/GisMapCardPreview";
import { SideProjectCard } from "@/components/shared/SideProjectCard";
import { education, universityProjects } from "@/content/education";
import { experience } from "@/content/experience";
import { ContactEmail } from "@/components/shared/SiteNav";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5 },
  }),
};

export function BentoHome() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid auto-rows-[minmax(120px,auto)] gap-3 sm:grid-cols-12 sm:gap-4">
          <motion.div
            custom={0}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="rounded-3xl border border-border p-8 sm:col-span-7 sm:p-10"
            style={{ backgroundColor: "var(--card-muted)" }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Bento layout</p>
            <h1 className="mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
              {profile.title}
            </h1>
            <p className="mt-3 text-muted-foreground">{profile.name}</p>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {profile.summary}
            </p>
          </motion.div>

          <motion.div
            custom={1}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="flex flex-col justify-between rounded-3xl border border-border bg-gradient-to-br from-card to-transparent p-8 sm:col-span-5"
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Contact</p>
              <p className="mt-4 text-sm text-muted-foreground">Email only for now</p>
            </div>
            <ContactEmail />
          </motion.div>

          {sideProjects.map((p, i) => (
            <motion.div
              key={p.id}
              id={i === 0 ? "projects" : undefined}
              custom={i + 2}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className={sideProjects.length > 1 ? "sm:col-span-6" : "sm:col-span-12"}
            >
              <SideProjectCard
                project={p}
                className="h-full rounded-3xl"
                preview={p.id === "gis-map" ? <GisMapCardPreview /> : undefined}
              />
            </motion.div>
          ))}

          <motion.div
            custom={6}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            id="experience"
            className="rounded-3xl border border-border p-8 sm:col-span-12"
            style={{ backgroundColor: "var(--card-muted)" }}
          >
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted">Experience</h2>
            <div className="mt-6 space-y-8">
              {experience.map((job) => (
                <div
                  key={job.company}
                  className="border-t border-border pt-6 first:border-0 first:pt-0"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-medium text-foreground">
                      {job.title} · {job.company}
                    </h3>
                    <span className="text-sm text-muted">{job.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{job.summary}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            custom={7}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="rounded-3xl border border-border p-6 sm:col-span-6"
          >
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted">University</h2>
            <ul className="mt-4 space-y-3">
              {universityProjects.map((u) => (
                <li key={u.name} className="text-sm text-muted-foreground">
                  <span className="text-foreground">{u.name}</span>: {u.description}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            custom={8}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="rounded-3xl border border-border p-6 sm:col-span-6"
          >
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted">Education</h2>
            {education.map((e) => (
              <div key={e.school} className="mt-4">
                <p className="font-medium text-foreground">{e.degree}</p>
                <p className="text-sm text-muted-foreground">
                  {e.school} · {e.result.label} {e.result.value}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
