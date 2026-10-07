"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { profile } from "@/content/profile";
import { trackPointer } from "@/components/shared/Spotlight";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function RotatingTopic({ topics }: { topics: readonly string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % topics.length), 2600);
    return () => window.clearInterval(id);
  }, [topics.length]);

  return (
    <span className="inline-block">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={topics[index]}
          initial={{ y: "0.4em", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-0.4em", opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="inline-block bg-gradient-to-r from-accent to-accent-2 bg-clip-text font-medium text-transparent"
        >
          {topics[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function MotionHero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(".motion-line", {
        y: 32,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      onPointerMove={trackPointer}
      className="group relative overflow-hidden border-b border-border"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-dot-grid absolute inset-0" />
        <div className="hero-cursor-glow absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="bg-dot-grid-lit absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="animate-drift absolute -left-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-accent/20 blur-3xl" />
        <div className="animate-drift-slow absolute -bottom-48 -right-40 h-[30rem] w-[30rem] rounded-full bg-accent-2/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28">
        <p className="motion-line flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          <span>{profile.title}</span>
          <span aria-hidden>·</span>
          <span>{profile.location}</span>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <span className="hidden sm:inline">{profile.coordinates}</span>
        </p>

        <h1 className="motion-line mt-6 text-5xl font-semibold tracking-tighter text-foreground sm:text-7xl lg:text-8xl">
          {profile.shortName}
        </h1>

        <p className="motion-line mt-6 max-w-2xl text-xl leading-snug text-muted-foreground sm:text-2xl">
          <span className="sr-only">{profile.tagline}</span>
          <span aria-hidden>
            {profile.taglineLead} <RotatingTopic topics={profile.taglineTopics} />.
          </span>
        </p>

        <div className="motion-line mt-10 flex flex-wrap items-center gap-3">
          <a
            href="#experience"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90"
          >
            View experience
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-accent/50"
          >
            Email me
          </a>
          <Link
            href="/resume"
            className="px-2 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Resume
          </Link>
        </div>

        <dl className="motion-line mt-14 grid max-w-2xl grid-cols-3 gap-4 border-t border-border pt-6">
          {profile.stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse gap-1">
              <dt className="text-xs leading-snug text-muted-foreground">{s.label}</dt>
              <dd className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
