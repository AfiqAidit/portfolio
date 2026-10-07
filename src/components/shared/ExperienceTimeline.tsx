"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll } from "framer-motion";
import { experience, type ExperienceRole } from "@/content/experience";
import { Reveal } from "./Reveal";
import { Spotlight } from "./Spotlight";

function TimelineItem({
  job,
  first,
  last,
}: {
  job: ExperienceRole;
  first: boolean;
  last: boolean;
}) {
  const lineRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: lineRef,
    offset: ["start 35%", "end 35%"],
  });
  const current = job.period.endsWith("Present");
  const lineSpan = `${first ? "top-8" : "top-0"} ${last ? "h-8" : "bottom-0"}`;

  return (
    <li className="sm:grid sm:grid-cols-[200px_1fr]">
      <p className="hidden pr-8 pt-7 text-right font-mono text-xs text-muted sm:block">
        {job.period}
      </p>
      <div className={`relative pl-8 ${last ? "" : "pb-8"}`}>
        <p className="pb-2 pt-6 font-mono text-xs text-muted sm:hidden">{job.period}</p>
        <span
          ref={lineRef}
          aria-hidden
          className={`absolute left-0 w-0.5 -translate-x-1/2 bg-foreground/15 ${lineSpan}`}
        />
        <motion.span
          aria-hidden
          style={{ scaleY: reduceMotion ? 1 : scrollYProgress }}
          className={`absolute left-0 w-0.5 origin-top -translate-x-1/2 bg-gradient-to-b from-accent to-accent-2 ${lineSpan}`}
        />
        <span
          aria-hidden
          className="absolute left-0 top-7 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-foreground/30 bg-background"
        />
        <motion.span
          aria-hidden
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ margin: "0px 0px -65% 0px" }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="absolute -left-1.5 top-7 z-10 h-3 w-3 rounded-full border-2 border-accent bg-background shadow-[0_0_12px_var(--accent)]"
        />
        <Reveal>
          <Spotlight as="article" className="rounded-2xl border border-border bg-card p-6">
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
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{job.summary}</p>
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
}

export function ExperienceTimeline() {
  return (
    <ol className="mt-12 pl-1.5 sm:pl-0">
      {experience.map((job, i) => (
        <TimelineItem
          key={`${job.company}-${job.period}`}
          job={job}
          first={i === 0}
          last={i === experience.length - 1}
        />
      ))}
    </ol>
  );
}
