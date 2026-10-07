"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll } from "framer-motion";
import { experience } from "@/content/experience";
import { Reveal } from "./Reveal";
import { Spotlight } from "./Spotlight";

export function ExperienceTimeline() {
  const ref = useRef<HTMLOListElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 60%"],
  });

  return (
    <ol ref={ref} className="relative mt-12">
      <span
        aria-hidden
        className="absolute bottom-0 left-0 top-7 w-0.5 rounded-full bg-foreground/15 sm:left-[212px]"
      />
      <motion.span
        aria-hidden
        style={{ scaleY: reduceMotion ? 1 : scrollYProgress }}
        className="absolute bottom-0 left-0 top-7 w-0.5 origin-top rounded-full bg-gradient-to-b from-accent to-accent-2 sm:left-[212px]"
      />
      {experience.map((job, i) => {
        const current = job.period.endsWith("Present");
        const last = i === experience.length - 1;
        return (
          <li
            key={`${job.company}-${job.period}`}
            className={`grid gap-2 sm:grid-cols-[180px_1fr] sm:gap-8 ${last ? "" : "pb-8"}`}
          >
            <p className="pl-6 font-mono text-xs text-muted sm:pl-0 sm:pt-7 sm:text-right">
              {job.period}
            </p>
            <div className="relative pl-6">
              <span
                aria-hidden
                className="absolute -left-1 top-7 h-2.5 w-2.5 rounded-full bg-muted ring-4 ring-band"
              />
              <motion.span
                aria-hidden
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "0px 0px -40% 0px" }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="absolute -left-1 top-7 h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]"
              />
              <Reveal>
                <Spotlight
                  as="article"
                  className="rounded-2xl border border-border bg-card p-6"
                >
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
                      <span
                        key={s}
                        className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Spotlight>
              </Reveal>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
